package ai.movehack.roadaccidents;

import android.graphics.Bitmap;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.support.v7.app.AppCompatActivity;
import android.text.method.ScrollingMovementMethod;
import android.util.Log;
import android.view.View;
import android.widget.Button;
import android.widget.ImageView;
import android.widget.TextView;

import com.wonderkiln.camerakit.CameraKitError;
import com.wonderkiln.camerakit.CameraKitEvent;
import com.wonderkiln.camerakit.CameraKitEventListener;
import com.wonderkiln.camerakit.CameraKitImage;
import com.wonderkiln.camerakit.CameraKitVideo;
import com.wonderkiln.camerakit.CameraView;

import org.json.JSONObject;

import java.util.List;
import java.util.concurrent.Executor;
import java.util.concurrent.Executors;

import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import okhttp3.WebSocket;
import okhttp3.WebSocketListener;

public class MainActivity extends AppCompatActivity {

    private static final int INPUT_SIZE = 300;
    private static final String INPUT_NAME = "image_tensor";
    private static final String OUTPUT_NAME = "detection_boxes,detection_scores,detection_classes,num_detections";

    private static final String MODEL_FILE = "file:///android_asset/frozen_inference_graph.pb";
    private static final String LABEL_FILE = "file:///android_asset/label_strings.txt";

    private Classifier classifier;
    private Executor executor = Executors.newSingleThreadExecutor();
    private TextView textViewResult;
    private Button btnDetectObject;
    private ImageView imageViewResult;
    private CameraView cameraView;

    private OkHttpClient client;
    private WebSocket webSocket;
    private static final String SERVER_URL = "ws://10.0.2.2:5000/socket.io/?EIO=4&transport=websocket";
    private Handler mainHandler = new Handler(Looper.getMainLooper());

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        cameraView = (CameraView) findViewById(R.id.cameraView);
        imageViewResult = (ImageView) findViewById(R.id.imageViewResult);
        textViewResult = (TextView) findViewById(R.id.textViewResult);
        textViewResult.setMovementMethod(new ScrollingMovementMethod());

        btnDetectObject = (Button) findViewById(R.id.btnDetectObject);

        cameraView.addCameraKitListener(new CameraKitEventListener() {
            @Override
            public void onEvent(CameraKitEvent cameraKitEvent) {

            }

            @Override
            public void onError(CameraKitError cameraKitError) {

            }

            @Override
            public void onImage(CameraKitImage cameraKitImage) {

                Bitmap bitmap = cameraKitImage.getBitmap();

                bitmap = Bitmap.createScaledBitmap(bitmap, INPUT_SIZE, INPUT_SIZE, false);

                final List<Classifier.Recognition> results = classifier.recognizeImage(bitmap);

                imageViewResult.setImageBitmap(bitmap);

                textViewResult.setText(results.toString());

                for (Classifier.Recognition result : results) {
                    if (result.getTitle() != null && result.getTitle().contains("car accident") && result.getConfidence() != null && result.getConfidence() >= 0.6f) {
                        sendAccidentAlert(result.getConfidence());
                    }
                }
            }

            @Override
            public void onVideo(CameraKitVideo cameraKitVideo) {

            }
        });

        btnDetectObject.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                cameraView.captureImage();
            }
        });

        initTensorFlowAndLoadModel();
        connectWebSocket();
    }

    private void connectWebSocket() {
        if (client == null) {
            client = new OkHttpClient();
        }
        Request request = new Request.Builder().url(SERVER_URL).build();
        webSocket = client.newWebSocket(request, new WebSocketListener() {
            @Override
            public void onOpen(WebSocket webSocket, Response response) {
                Log.i("WebSocket", "Connected to server");
            }

            @Override
            public void onMessage(WebSocket webSocket, String text) {
                if (text.equals("2")) {
                    webSocket.send("3");
                }
            }

            @Override
            public void onClosed(WebSocket webSocket, int code, String reason) {
                Log.i("WebSocket", "Closed");
                reconnect();
            }

            @Override
            public void onFailure(WebSocket webSocket, Throwable t, Response response) {
                Log.e("WebSocket", "Error : " + t.getMessage());
                reconnect();
            }
        });
    }

    private void reconnect() {
        mainHandler.postDelayed(new Runnable() {
            @Override
            public void run() {
                Log.i("WebSocket", "Reconnecting...");
                connectWebSocket();
            }
        }, 5000);
    }

    private void sendAccidentAlert(float confidence) {
        if (webSocket != null) {
            try {
                JSONObject payload = new JSONObject();
                payload.put("confidence", confidence);
                payload.put("type", "car accident");
                // Provide a default test location for the emulator
                payload.put("latitude", 28.6139);
                payload.put("longitude", 77.2090);

                String message = "42[\"accident_detected\"," + payload.toString() + "]";
                webSocket.send(message);
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        cameraView.start();
    }

    @Override
    protected void onPause() {
        cameraView.stop();
        super.onPause();
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        executor.execute(new Runnable() {
            @Override
            public void run() {
                classifier.close();
            }
        });
    }

    private void initTensorFlowAndLoadModel() {
        executor.execute(new Runnable() {
            @Override
            public void run() {
                try {
                    classifier = TensorFlowImageClassifier.create(
                            getAssets(),
                            MODEL_FILE,
                            LABEL_FILE,
                            INPUT_SIZE,
                            INPUT_NAME,
                            OUTPUT_NAME);
                    makeButtonVisible();
                } catch (final Exception e) {
                    throw new RuntimeException("Error initializing TensorFlow!", e);
                }
            }
        });
    }

    private void makeButtonVisible() {
        runOnUiThread(new Runnable() {
            @Override
            public void run() {
                btnDetectObject.setVisibility(View.VISIBLE);
            }
        });
    }
}
