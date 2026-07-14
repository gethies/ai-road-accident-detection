export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 lg:px-8">
      <h1 className="font-display text-4xl font-bold">About AccidentWatch</h1>
      <p className="mt-4 text-lg text-dim-gray">
        An AI-powered road safety platform built on the original{" "}
        <strong className="text-mist-white">Accident Detection on Indian Roads</strong>{" "}
        project — extending TensorFlow SSD detection into a real-time web platform.
      </p>

      <section className="mt-10 space-y-4">
        <h2 className="font-display text-2xl font-semibold">The Model</h2>
        <p className="text-dim-gray">
          AccidentWatch uses a Single Shot Detector (SSD) object detection model trained
          on Indian road accident imagery. The frozen inference graph (
          <code className="font-mono text-lane-yellow">frozen_inference_graph.pb</code>
          ) detects vehicle collisions and accident scenes from single-camera road views.
        </p>
        <ul className="list-inside list-disc space-y-2 text-dim-gray">
          <li>Architecture: TensorFlow SSD with MobileNet backbone</li>
          <li>Classes: Car accident (single-class detector)</li>
          <li>Typical confidence threshold: 0.5–0.6</li>
          <li>Also available on Android via TensorFlow Lite</li>
        </ul>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="font-display text-2xl font-semibold">Dataset & Accuracy</h2>
        <p className="text-dim-gray">
          Trained on diverse Indian road scenarios including highway pile-ups, city
          intersections, two-wheeler collisions, and truck accidents. Best performance on
          clear daytime images with unobstructed camera views.
        </p>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="font-display text-2xl font-semibold">Limitations</h2>
        <ul className="list-inside list-disc space-y-2 text-dim-gray">
          <li>Reduced accuracy in heavy rain, fog, or night conditions</li>
          <li>Works best with single fixed-camera perspectives</li>
          <li>May produce false positives on traffic jams or construction zones</li>
          <li>Grad-CAM and forensics features are indicative, not forensic-grade</li>
        </ul>
      </section>

      <section className="mt-10 glass-panel p-6">
        <h2 className="font-display text-xl font-semibold">Open Source</h2>
        <p className="mt-2 text-dim-gray">
          Based on the original project by the Accident Detection on Indian Roads team.
          Extended with FastAPI, Next.js, PostgreSQL, WebSockets, and emergency dispatch
          integrations.
        </p>
        <a
          href="https://github.com"
          className="mt-4 inline-block text-lane-yellow hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          View on GitHub →
        </a>
      </section>
    </div>
  );
}
