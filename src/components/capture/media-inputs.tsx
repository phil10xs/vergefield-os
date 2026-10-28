const fileClass =
  "w-full rounded-xl border border-dashed border-input bg-background px-3 py-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-secondary-foreground";

function MediaInput({
  label,
  hint,
  accept,
  capture,
  multiple,
  required,
}: {
  label: string;
  hint: string;
  accept: string;
  capture?: "user" | "environment";
  multiple?: boolean;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold">{label}</span>
      <input
        type="file"
        name="media"
        accept={accept}
        capture={capture}
        multiple={multiple}
        required={required}
        className={fileClass}
      />
      <span className="mt-1 block text-xs text-muted-foreground">{hint}</span>
    </label>
  );
}

export function MediaInputs({ required = false }: { required?: boolean }) {
  return (
    <div className="space-y-3">
      <MediaInput
        label="Photos or video from your device"
        hint="Choose one or more files from the photo library or file picker."
        accept="image/*,video/*"
        multiple
        required={required}
      />
      <MediaInput
        label="Take a photo now"
        hint="On a phone this opens the camera for a still. On a computer it opens the file picker."
        accept="image/*"
        capture="environment"
      />
      <MediaInput
        label="Record a video now"
        hint="On a phone this opens the camera to record. On a computer it opens the file picker."
        accept="video/*"
        capture="environment"
      />
      <p className="text-xs text-muted-foreground">
        Up to 50 MB per file. Files stay on the trade business system.
      </p>
    </div>
  );
}
