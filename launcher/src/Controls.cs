using System;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Runtime.InteropServices;
using System.Windows.Forms;

namespace Windy10v10AI.Launcher
{
    static class Theme
    {
        public static readonly Color Background = ColorTranslator.FromHtml("#161412");
        public static readonly Color Panel = ColorTranslator.FromHtml("#211d1a");
        public static readonly Color PanelHover = ColorTranslator.FromHtml("#2a2420");
        public static readonly Color ActivePanel = ColorTranslator.FromHtml("#2a1d19");
        public static readonly Color Border = ColorTranslator.FromHtml("#3b3029");
        public static readonly Color Accent = ColorTranslator.FromHtml("#e0552d");
        public static readonly Color AccentHover = ColorTranslator.FromHtml("#f06a40");
        public static readonly Color Text = ColorTranslator.FromHtml("#eee7e0");
        public static readonly Color Muted = ColorTranslator.FromHtml("#aca198");
        public static readonly Color Faint = ColorTranslator.FromHtml("#7f756d");
        public static readonly Color Ok = ColorTranslator.FromHtml("#3fb67a");
        public static readonly Color Warning = ColorTranslator.FromHtml("#e5a93a");
        public static readonly Color WarningPanel = ColorTranslator.FromHtml("#2a2418");
        public static readonly Color WarningBorder = ColorTranslator.FromHtml("#6b5423");
        public static readonly Color Error = ColorTranslator.FromHtml("#e5484d");
        public static readonly Color ErrorPanel = ColorTranslator.FromHtml("#2a1718");
        public static readonly Color ErrorBorder = ColorTranslator.FromHtml("#6b2a2c");

        public const string FontName = "Microsoft YaHei UI";

        // Read from the screen so it is available before any window handle exists
        public static float Dpi
        {
            get { using (var g = Graphics.FromHwnd(IntPtr.Zero)) return g.DpiX; }
        }

        public static GraphicsPath Rounded(RectangleF rect, float radius)
        {
            var d = radius * 2;
            var path = new GraphicsPath();
            path.AddArc(rect.X, rect.Y, d, d, 180, 90);
            path.AddArc(rect.Right - d, rect.Y, d, d, 270, 90);
            path.AddArc(rect.Right - d, rect.Bottom - d, d, d, 0, 90);
            path.AddArc(rect.X, rect.Bottom - d, d, d, 90, 90);
            path.CloseFigure();
            return path;
        }

        // Windows 10 20H1+ and 11 honor attribute 20; earlier Windows 10 builds used 19
        public static void UseDarkTitleBar(IntPtr handle)
        {
            try
            {
                var on = 1;
                if (DwmSetWindowAttribute(handle, 20, ref on, 4) != 0) DwmSetWindowAttribute(handle, 19, ref on, 4);
            }
            catch (Exception)
            {
                // Older Windows without DWM dark mode keeps the default title bar
            }
        }

        [DllImport("dwmapi.dll")]
        static extern int DwmSetWindowAttribute(IntPtr hwnd, int attribute, ref int value, int size);
    }

    abstract class PaintedControl : Control
    {
        protected PaintedControl()
        {
            SetStyle(ControlStyles.UserPaint | ControlStyles.AllPaintingInWmPaint | ControlStyles.OptimizedDoubleBuffer |
                ControlStyles.ResizeRedraw | ControlStyles.SupportsTransparentBackColor, true);
            BackColor = Theme.Background;
        }

        protected float DpiScale
        {
            get { return Theme.Dpi / 96f; }
        }

        protected static Graphics Prepare(PaintEventArgs e)
        {
            e.Graphics.SmoothingMode = SmoothingMode.AntiAlias;
            e.Graphics.PixelOffsetMode = PixelOffsetMode.HighQuality;
            return e.Graphics;
        }
    }

    class ModeButton : PaintedControl
    {
        public string Title;
        public string Sub;
        public string ActiveSub;
        public bool Active;
        public bool Dimmed;
        bool hover;

        public ModeButton()
        {
            Cursor = Cursors.Hand;
            TabStop = true;
        }

        protected override void OnMouseEnter(EventArgs e) { hover = true; Invalidate(); base.OnMouseEnter(e); }
        protected override void OnMouseLeave(EventArgs e) { hover = false; Invalidate(); base.OnMouseLeave(e); }
        protected override void OnGotFocus(EventArgs e) { Invalidate(); base.OnGotFocus(e); }
        protected override void OnLostFocus(EventArgs e) { Invalidate(); base.OnLostFocus(e); }

        protected override void OnKeyDown(KeyEventArgs e)
        {
            if (e.KeyCode == Keys.Enter || e.KeyCode == Keys.Space) OnClick(EventArgs.Empty);
            base.OnKeyDown(e);
        }

        protected override void OnPaint(PaintEventArgs e)
        {
            var g = Prepare(e);
            var s = Height / 84f;
            var interactive = Enabled && !Dimmed;
            var fill = Active ? Theme.ActivePanel : (hover && interactive ? Theme.PanelHover : Theme.Panel);
            var edge = Active || (interactive && (hover || (Focused && ShowFocusCues))) ? Theme.Accent : Theme.Border;
            var rect = new RectangleF(0.5f, 0.5f, Width - 1.5f, Height - 1.5f);
            using (var path = Theme.Rounded(rect, 8 * s))
            using (var brush = new SolidBrush(fill))
            using (var pen = new Pen(edge, Math.Max(1f, s)))
            {
                g.FillPath(brush, path);
                g.DrawPath(pen, path);
            }

            var d = 28 * s;
            var circle = new RectangleF((Width - d) / 2, 10 * s, d, d);
            using (var brush = new SolidBrush(Theme.Accent)) g.FillEllipse(brush, circle);
            var cx = circle.X + d / 2 + 1.5f * s;
            var cy = circle.Y + d / 2;
            var t = 6 * s;
            g.FillPolygon(Brushes.White, new[] { new PointF(cx - t * 0.8f, cy - t), new PointF(cx + t, cy), new PointF(cx - t * 0.8f, cy + t) });

            using (var titleFont = new Font(Theme.FontName, 13.5f, FontStyle.Bold))
            using (var subFont = new Font(Theme.FontName, 9f))
            {
                TextRenderer.DrawText(g, Title, titleFont, new Rectangle(0, (int)(40 * s), Width, (int)(24 * s)), Theme.Text,
                    TextFormatFlags.HorizontalCenter | TextFormatFlags.VerticalCenter | TextFormatFlags.NoPadding);
                TextRenderer.DrawText(g, Active ? ActiveSub : Sub, subFont, new Rectangle(0, (int)(63 * s), Width, (int)(16 * s)), Theme.Muted,
                    TextFormatFlags.HorizontalCenter | TextFormatFlags.VerticalCenter | TextFormatFlags.NoPadding);
            }

            if (Dimmed)
            {
                using (var veil = new SolidBrush(Color.FromArgb(140, Theme.Background))) g.FillRectangle(veil, ClientRectangle);
            }
        }
    }

    enum NoticeKind { Warning, Error }

    class NoticeBar : PaintedControl
    {
        public NoticeKind Kind;
        public readonly Label Message = new Label();
        public readonly FlatButton Action = new FlatButton();
        bool hasAction;

        public NoticeBar()
        {
            Message.ForeColor = Theme.Text;
            Message.BackColor = Color.Transparent;
            Message.Font = new Font(Theme.FontName, 9f);
            Message.TextAlign = ContentAlignment.MiddleLeft;
            Action.Visible = false;
            Action.Font = new Font(Theme.FontName, 8.25f);
            Controls.Add(Message);
            Controls.Add(Action);
        }

        public void Show(NoticeKind kind, string text, string action)
        {
            if (Visible && Kind == kind && Message.Text == text && hasAction == (action != null)) return;
            Kind = kind;
            Message.Text = text;
            Action.Text = action ?? "";
            hasAction = action != null;
            Action.Visible = hasAction;
            Action.BorderColor = kind == NoticeKind.Error ? Theme.ErrorBorder : Theme.WarningBorder;
            Visible = true;
            LayoutChildren();
            Invalidate();
        }

        protected override void OnResize(EventArgs e)
        {
            base.OnResize(e);
            LayoutChildren();
        }

        void LayoutChildren()
        {
            var s = DpiScale;
            var right = Width - (int)(10 * s);
            // Visible reads false until the window is shown, so layout keys off the requested state
            if (hasAction)
            {
                var w = TextRenderer.MeasureText(Action.Text, Action.Font).Width + (int)(16 * s);
                Action.SetBounds(right - w, (Height - (int)(24 * s)) / 2, w, (int)(24 * s));
                right = Action.Left - (int)(10 * s);
            }
            Message.SetBounds((int)(40 * s), (int)(4 * s), right - (int)(40 * s), Height - (int)(8 * s));
        }

        protected override void OnPaint(PaintEventArgs e)
        {
            var g = Prepare(e);
            var s = DpiScale;
            var fill = Kind == NoticeKind.Error ? Theme.ErrorPanel : Theme.WarningPanel;
            var edge = Kind == NoticeKind.Error ? Theme.ErrorBorder : Theme.WarningBorder;
            var icon = Kind == NoticeKind.Error ? Theme.Error : Theme.Warning;
            using (var path = Theme.Rounded(new RectangleF(0.5f, 0.5f, Width - 1.5f, Height - 1.5f), 8 * s))
            using (var brush = new SolidBrush(fill))
            using (var pen = new Pen(edge, Math.Max(1f, s)))
            {
                g.FillPath(brush, path);
                g.DrawPath(pen, path);
            }
            var cx = 22 * s;
            var cy = Height / 2f;
            using (var pen = new Pen(icon, 1.8f * s) { LineJoin = LineJoin.Round })
            {
                g.DrawPolygon(pen, new[] { new PointF(cx, cy - 9 * s), new PointF(cx + 10 * s, cy + 8 * s), new PointF(cx - 10 * s, cy + 8 * s) });
                g.DrawLine(pen, cx, cy - 3 * s, cx, cy + 2 * s);
                g.DrawLine(pen, cx, cy + 4.5f * s, cx, cy + 5.5f * s);
            }
        }
    }

    // Stands in for real progress, which the server does not report; it only shows the launcher is still working
    class MarqueeBar : PaintedControl
    {
        readonly Timer timer = new Timer { Interval = 16 };
        float position;

        public MarqueeBar()
        {
            timer.Tick += delegate
            {
                position = (position + 0.012f) % 1.4f;
                Invalidate();
            };
        }

        protected override void OnVisibleChanged(EventArgs e)
        {
            timer.Enabled = Visible;
            base.OnVisibleChanged(e);
        }

        protected override void OnPaint(PaintEventArgs e)
        {
            var g = Prepare(e);
            var r = Height / 2f;
            using (var track = new SolidBrush(Theme.Border))
            using (var path = Theme.Rounded(new RectangleF(0, 0, Width, Height), r))
            {
                g.FillPath(track, path);
            }
            var segment = Width * 0.3f;
            var x = (position - 0.3f) * Width;
            g.SetClip(new RectangleF(0, 0, Width, Height));
            using (var fill = new SolidBrush(Theme.Accent))
            using (var path = Theme.Rounded(new RectangleF(x, 0, segment, Height), r))
            {
                g.FillPath(fill, path);
            }
        }

        protected override void Dispose(bool disposing)
        {
            if (disposing) timer.Dispose();
            base.Dispose(disposing);
        }
    }

    // The stock flat checkbox renders grey on dark backgrounds and reads as disabled
    class ToggleBox : PaintedControl
    {
        bool isChecked;
        public event EventHandler CheckedChanged;

        public ToggleBox()
        {
            Cursor = Cursors.Hand;
            TabStop = true;
            Font = new Font(Theme.FontName, 8.25f);
        }

        public bool Checked
        {
            get { return isChecked; }
            set
            {
                if (isChecked == value) return;
                isChecked = value;
                Invalidate();
                if (CheckedChanged != null) CheckedChanged(this, EventArgs.Empty);
            }
        }

        public int PreferredWidth
        {
            get { return (int)(20 * DpiScale) + TextRenderer.MeasureText(Text, Font).Width; }
        }

        protected override void OnClick(EventArgs e)
        {
            if (Enabled) Checked = !Checked;
            base.OnClick(e);
        }

        protected override void OnKeyDown(KeyEventArgs e)
        {
            if (e.KeyCode == Keys.Space) OnClick(EventArgs.Empty);
            base.OnKeyDown(e);
        }

        protected override void OnPaint(PaintEventArgs e)
        {
            var g = Prepare(e);
            var s = DpiScale;
            var size = 14 * s;
            var box = new RectangleF(0.5f, (Height - size) / 2, size, size);
            using (var path = Theme.Rounded(box, 3 * s))
            {
                if (isChecked)
                {
                    using (var brush = new SolidBrush(Theme.Accent)) g.FillPath(brush, path);
                    using (var pen = new Pen(Color.White, 1.8f * s) { StartCap = LineCap.Round, EndCap = LineCap.Round, LineJoin = LineJoin.Round })
                    {
                        g.DrawLines(pen, new[]
                        {
                            new PointF(box.X + 3.2f * s, box.Y + 7.2f * s),
                            new PointF(box.X + 6f * s, box.Y + 10f * s),
                            new PointF(box.X + 11f * s, box.Y + 4.2f * s),
                        });
                    }
                }
                else
                {
                    using (var pen = new Pen(Theme.Muted, Math.Max(1f, s))) g.DrawPath(pen, path);
                }
            }
            TextRenderer.DrawText(g, Text, Font, new Rectangle((int)(20 * s), 0, Width - (int)(20 * s), Height),
                Enabled ? Theme.Text : Theme.Faint, TextFormatFlags.VerticalCenter | TextFormatFlags.Left | TextFormatFlags.NoPadding);
        }
    }

    class FlatButton : Button
    {
        public FlatButton()
        {
            FlatStyle = FlatStyle.Flat;
            BackColor = Theme.Background;
            ForeColor = Theme.Text;
            Font = new Font(Theme.FontName, 9f);
            Cursor = Cursors.Hand;
            BorderColor = Theme.Border;
            FlatAppearance.MouseOverBackColor = Theme.PanelHover;
            FlatAppearance.MouseDownBackColor = Theme.Panel;
            UseVisualStyleBackColor = false;
        }

        public Color BorderColor
        {
            get { return FlatAppearance.BorderColor; }
            set { FlatAppearance.BorderColor = value; }
        }

        public void MakePrimary()
        {
            BackColor = Theme.Accent;
            ForeColor = Color.White;
            BorderColor = Theme.Accent;
            FlatAppearance.MouseOverBackColor = Theme.AccentHover;
            FlatAppearance.MouseDownBackColor = Theme.Accent;
            Font = new Font(Theme.FontName, 9f, FontStyle.Bold);
        }
    }

    class ConfirmDialog : Form
    {
        ConfirmDialog(string title, string body, string confirm)
        {
            var s = Theme.Dpi / 96f;
            Text = title;
            FormBorderStyle = FormBorderStyle.FixedDialog;
            MaximizeBox = false;
            MinimizeBox = false;
            ShowInTaskbar = false;
            StartPosition = FormStartPosition.CenterParent;
            BackColor = Theme.Panel;
            ForeColor = Theme.Text;
            Font = new Font(Theme.FontName, 9.75f);
            ClientSize = new Size((int)(360 * s), (int)(150 * s));

            var heading = new Label { Text = title, Font = new Font(Theme.FontName, 11.25f, FontStyle.Bold), AutoSize = false };
            heading.SetBounds((int)(20 * s), (int)(18 * s), (int)(320 * s), (int)(24 * s));
            var message = new Label { Text = body, AutoSize = false };
            message.SetBounds((int)(20 * s), (int)(46 * s), (int)(320 * s), (int)(48 * s));

            var ok = new FlatButton { Text = confirm, DialogResult = DialogResult.OK };
            ok.MakePrimary();
            var cancel = new FlatButton { Text = Strings.Cancel, DialogResult = DialogResult.Cancel, BackColor = Theme.Panel };
            var okWidth = Math.Max((int)(96 * s), TextRenderer.MeasureText(confirm, ok.Font).Width + (int)(28 * s));
            ok.SetBounds(ClientSize.Width - (int)(20 * s) - okWidth, (int)(104 * s), okWidth, (int)(32 * s));
            cancel.SetBounds(ok.Left - (int)(8 * s) - (int)(80 * s), (int)(104 * s), (int)(80 * s), (int)(32 * s));

            Controls.AddRange(new Control[] { heading, message, cancel, ok });
            AcceptButton = ok;
            CancelButton = cancel;
        }

        protected override void OnHandleCreated(EventArgs e)
        {
            base.OnHandleCreated(e);
            Theme.UseDarkTitleBar(Handle);
        }

        public static bool Ask(IWin32Window owner, string title, string body, string confirm)
        {
            using (var dialog = new ConfirmDialog(title, body, confirm))
            {
                return dialog.ShowDialog(owner) == DialogResult.OK;
            }
        }
    }
}
