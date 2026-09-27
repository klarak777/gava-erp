package com.gava.pda;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.Build;
import android.os.Bundle;
import org.json.JSONObject;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private static final String SCANNER_RESULT_ACTION = "nlscan.action.SCANNER_RESULT";
    private static final String SCANNER_CONFIG_ACTION = "ACTION_BAR_SCANCFG";
    private BroadcastReceiver scannerReceiver;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        scannerReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                if (!SCANNER_RESULT_ACTION.equals(intent.getAction())) return;
                if (!"ok".equals(intent.getStringExtra("SCAN_STATE"))) return;

                String barcode = intent.getStringExtra("SCAN_BARCODE1");
                if (barcode == null || barcode.isEmpty()) return;
                dispatchBarcode(barcode);
            }
        };

        IntentFilter filter = new IntentFilter(SCANNER_RESULT_ACTION);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(scannerReceiver, filter, Context.RECEIVER_EXPORTED);
        } else {
            registerReceiver(scannerReceiver, filter);
        }
    }

    @Override
    public void onResume() {
        super.onResume();
        configureScanner(3); // Newland: Output via API
    }

    @Override
    public void onPause() {
        configureScanner(2); // Más alkalmazásokhoz: Simulate keystroke
        super.onPause();
    }

    @Override
    public void onDestroy() {
        if (scannerReceiver != null) {
            unregisterReceiver(scannerReceiver);
            scannerReceiver = null;
        }
        super.onDestroy();
    }

    private void configureScanner(int outputMode) {
        Intent config = new Intent(SCANNER_CONFIG_ACTION);
        config.putExtra("EXTRA_SCAN_MODE", outputMode);
        config.putExtra("EXTRA_SCAN_AUTOENT", 0);
        sendBroadcast(config);
    }

    private void dispatchBarcode(String barcode) {
        String script = "window.dispatchEvent(new CustomEvent('pda-barcode-scanned',{detail:" +
            JSONObject.quote(barcode) + "}));";
        getBridge().getWebView().post(() -> getBridge().getWebView().evaluateJavascript(script, null));
    }
}
