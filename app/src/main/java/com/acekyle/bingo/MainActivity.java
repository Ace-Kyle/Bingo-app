package com.acekyle.bingo;

import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;

import android.view.View;
import android.webkit.ConsoleMessage;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

public class MainActivity extends AppCompatActivity {
    private static final String TAG = "MainActivity";
    private static final int STORAGE_PERMISSION_REQUEST_CODE = 1001;

    private WebView webView;
    private WebAppInterface webAppInterface;

    public View decorView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main2);

        //TODO - fix green bar
        this.decorView = getWindow().getDecorView();

        // Check for storage permission
        if (checkStoragePermission()) {
            //Log.d(TAG, "Storage permission already granted and ininit webview");
            initializeWebView();
        } else {
            requestStoragePermission();
        }
    }

    private boolean checkStoragePermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            // For Android 10 and above, we don't need external storage permission for app-specific files
            return true;
        } else {
            return ContextCompat.checkSelfPermission(this, Manifest.permission.READ_EXTERNAL_STORAGE)
                    == PackageManager.PERMISSION_GRANTED;
        }
    }

    private void requestStoragePermission() {
        ActivityCompat.requestPermissions(
                this,
                new String[]{Manifest.permission.READ_EXTERNAL_STORAGE},
                STORAGE_PERMISSION_REQUEST_CODE
        );
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == STORAGE_PERMISSION_REQUEST_CODE) {
            if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                initializeWebView();
            } else {
                Toast.makeText(this, "Storage permission is required", Toast.LENGTH_LONG).show();
                finish();
            }
        }
    }

    private void initializeWebView() {
        webView = findViewById(R.id.webview);

        hideNav();

        // Enable JavaScript
        WebSettings webSettings = webView.getSettings();
        webSettings.setDomStorageEnabled(true);

        webSettings.setJavaScriptEnabled(true);
        webSettings.setCacheMode(WebSettings.LOAD_NO_CACHE);

        // Add these settings in initializeWebView()
        webSettings.setUseWideViewPort(false);
        webSettings.setLoadWithOverviewMode(true);
        //webSettings.setBuiltInZoomControls(true);
        //webSettings.setDisplayZoomControls(false);
        //webSettings.setAppCacheEnabled(true);
        webSettings.setAllowFileAccess(true);
        webSettings.setAllowContentAccess(true);

        // Add debugging
        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onConsoleMessage(ConsoleMessage consoleMessage) {
                Log.d("WebView", consoleMessage.message() + " -- From line " +
                        consoleMessage.lineNumber() + " of " + consoleMessage.sourceId());
                return true;
            }
        });

        // Add WebViewClient to catch errors
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onReceivedError(WebView view, int errorCode, String description, String failingUrl) {
                Log.e("WebView", "Error: " + description);
                Toast.makeText(MainActivity.this, "WebView error: " + description, Toast.LENGTH_LONG).show();
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                Log.d("WebView", "Page loaded: " + url);
            }
        });

        // Create and add JavaScript interface
        webAppInterface = new WebAppInterface(this);
        webView.addJavascriptInterface(webAppInterface, "JSInterface");

        // Load the HTML file from assets
        Log.d("WebView", "Loading HTML from assets");
        webView.setWebViewClient(new Callback());
        webView.loadUrl("file:///android_asset/index.html");

        // In the initializeWebView() method, replace the loadUrl with:
        //String html = "<html><body style='background-color: yellow;'><h1>WebView Test</h1></body></html>";
        //webView.loadData(html, "text/html", "UTF-8");
    }

    @Override
    protected void onDestroy() {
        if (webAppInterface != null) {
            webAppInterface.cleanup();
        }
        super.onDestroy();
    }

    class Callback extends WebViewClient {
        @Override
        public boolean shouldOverrideUrlLoading(WebView view, String url) {
            return false;
        }
    }
    //custom add
    public void hideNav(){
        this.decorView.setSystemUiVisibility(5894);
    }
}