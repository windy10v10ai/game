import React, { useState } from 'react';

// 移除A,S（Dota默认占用）
export const VALID_BIND_KEYS = " BCDEFGHIJKLMNOPQRTUVWXYZ0123456789`-=[]\\;',./";

interface KeyCaptureBoxProps {
  bindKeyText: string;
  setBindKeyText: (key: string) => void;
  className?: string;
  style?: Partial<VCSSStyleDeclaration>;
  textStyle?: Partial<VCSSStyleDeclaration>;
}

/**
 * 点击激活单字符按键输入，校验通过后回写 bindKeyText。
 * 供 KeySettingButton（技能改键）与 WardKeySettingButton（Ward 改键）共用。
 */
const KeyCaptureBox = ({
  bindKeyText,
  setBindKeyText,
  className = 'BindingContainer',
  style,
  textStyle,
}: KeyCaptureBoxProps): React.ReactElement => {
  const [isActive, setIsActive] = useState(false);

  const activeKeySetting = (e: Panel) => {
    $.DispatchEvent('DOTAHideTextTooltip');
    if (isActive) {
      return;
    }
    setIsActive(true);

    const textEntry = e.FindChildTraverse('keyBindTextEntry') as TextEntry | null;
    if (textEntry) {
      textEntry.text = '';
      textEntry.SetFocus();
    }
  };

  const onTextEntryChange = (textEntry: TextEntry) => {
    const key = textEntry.text.toUpperCase();
    if (key === '') {
      return;
    }
    if (VALID_BIND_KEYS.indexOf(key) === -1) {
      textEntry.text = '';
      $.DispatchEvent('DOTAShowTextTooltip', textEntry, $.Localize('#key_bind_input_err'));
      $.Schedule(2, () => {
        $.DispatchEvent('DOTAHideTextTooltip');
      });
    } else {
      setBindKeyText(key);
      setIsActive(false);
    }
  };

  return (
    <Panel
      className={className}
      style={style}
      onmouseactivate={activeKeySetting}
      // on mouse over, show the tooltip
      onmouseover={(e) => {
        if (isActive) {
          return;
        }
        $.DispatchEvent('DOTAShowTextTooltip', e, $.Localize('#key_bind_mouseover_tooltop'));
      }}
      // on mouse out, hide the tooltip
      onmouseout={() => {
        $.DispatchEvent('DOTAHideTextTooltip');
      }}
    >
      <Label
        style={{ visibility: isActive ? 'collapse' : 'visible', ...textStyle }}
        className="BindingText"
        text={bindKeyText}
      />
      <TextEntry
        id="keyBindTextEntry"
        style={{ visibility: isActive ? 'visible' : 'collapse' }}
        className={`TextEntryArea ${isActive ? 'Actived' : ''}`}
        placeholder={$.Localize('#key_bind_placeholder')}
        maxchars={1}
        ontextentrychange={onTextEntryChange}
      />
    </Panel>
  );
};

export default KeyCaptureBox;
