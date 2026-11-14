package ai.nimi.apps.vane.dev;

import com.getcapacitor.BridgeActivity;
import androidx.webkit.WebViewFeature;
import android.widget.TextView;

public class MainActivity extends BridgeActivity {
    @Override protected void load() {
        if (!WebViewFeature.isFeatureSupported(WebViewFeature.WEB_MESSAGE_LISTENER)) {
            TextView message = new TextView(this);
            message.setText("Update Android System WebView to use Vane. A bridge restricted to the main frame and approved origin is required.");
            message.setPadding(32,64,32,32); setContentView(message); return;
        }
        registerPlugin(VaneFilesPlugin.class);
        super.load();
        bridge.getWebView().removeJavascriptInterface("androidBridge");
    }
}
