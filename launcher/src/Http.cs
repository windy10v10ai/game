using System.Collections.Generic;
using System.IO;
using System.Net;
using System.Text;
using System.Web.Script.Serialization;

namespace Windy10v10AI.Launcher
{
    static class Http
    {
        static Http()
        {
            // Apps built against .NET 4.0 do not offer TLS 1.2 by default, and every endpoint we call requires it
            ServicePointManager.SecurityProtocol |= (SecurityProtocolType)3072;
        }

        // Sends a POST when a form is given, otherwise a GET, and parses the JSON object in the response
        public static Dictionary<string, object> Json(string url, string form, int timeout)
        {
            var request = Create(url, timeout);
            if (form != null)
            {
                request.Method = "POST";
                request.ContentType = "application/x-www-form-urlencoded";
                var body = Encoding.ASCII.GetBytes(form);
                using (var stream = request.GetRequestStream()) stream.Write(body, 0, body.Length);
            }

            using (var response = request.GetResponse())
            using (var reader = new StreamReader(response.GetResponseStream(), Encoding.UTF8))
            {
                return (Dictionary<string, object>)new JavaScriptSerializer().DeserializeObject(reader.ReadToEnd());
            }
        }

        public static byte[] Bytes(string url, int timeout)
        {
            using (var response = Create(url, timeout).GetResponse())
            using (var stream = response.GetResponseStream())
            using (var buffer = new MemoryStream())
            {
                stream.CopyTo(buffer);
                return buffer.ToArray();
            }
        }

        static HttpWebRequest Create(string url, int timeout)
        {
            var request = (HttpWebRequest)WebRequest.Create(url);
            request.Timeout = timeout;
            request.ReadWriteTimeout = timeout;
            return request;
        }
    }
}
