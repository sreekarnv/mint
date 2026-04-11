import { Button } from '@/components/ui/button';
import { DocType, kycApi } from '@/lib/api/kyc';
import { cn } from '@/lib/utils';
import {
  CheckCircle2,
  CreditCard,
  FileText,
  Loader2,
  Upload,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { ID_DOC_OPTIONS } from './constants';

function DocUploadCard({
  type,
  label,
  description,
  uploaded,
  onUploaded,
  allowReplace = false,
}: {
  type: DocType;
  label: string;
  description: string;
  uploaded: boolean;
  onUploaded: () => void;
  allowReplace?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File) {
    setUploading(true);
    try {
      await kycApi.uploadDocument(file, type);
      toast.success(`${label} uploaded`);
      onUploaded();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div
      className={cn(
        'flex items-center gap-4 p-4 rounded-xl border transition-colors',
        uploaded
          ? 'border-emerald-200 bg-emerald-50/50'
          : 'border-border bg-card hover:border-primary/40',
      )}
    >
      <div
        className={cn(
          'h-10 w-10 rounded-full flex items-center justify-center shrink-0',
          uploaded ? 'bg-emerald-100' : 'bg-muted',
        )}
      >
        {uploaded ? (
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
        ) : (
          <FileText className="h-5 w-5 text-muted-foreground" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">
          {uploaded ? 'Uploaded successfully' : description}
        </p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,.pdf"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = '';
        }}
      />
      {!uploaded ? (
        <Button
          size="sm"
          variant="outline"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Upload className="h-3.5 w-3.5 mr-1.5" />
          )}
          {uploading ? 'Uploading…' : 'Upload'}
        </Button>
      ) : allowReplace ? (
        <Button
          size="sm"
          variant="ghost"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          {uploading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            'Replace'
          )}
        </Button>
      ) : null}
    </div>
  );
}

function BasicUpgradeSection({
  uploadedTypes,
  onUploaded,
}: {
  uploadedTypes: Set<string>;
  onUploaded: () => void;
}) {
  const uploadedIdType = uploadedTypes.has('PASSPORT')
    ? 'PASSPORT'
    : uploadedTypes.has('DRIVERS_LICENSE')
      ? 'DRIVERS_LICENSE'
      : null;

  const [selectedIdType, setSelectedIdType] = useState<DocType>(
    uploadedIdType ?? 'PASSPORT',
  );

  const activeIdType = uploadedIdType ?? selectedIdType;
  const activeOption = ID_DOC_OPTIONS.find((o) => o.type === activeIdType)!;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="h-5 w-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center shrink-0">
            1
          </span>
          <p className="text-xs font-semibold">Choose your ID document</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {ID_DOC_OPTIONS.map((opt) => {
            const isUploaded = uploadedTypes.has(opt.type);
            const isSelected = activeIdType === opt.type;
            const isOtherUploaded =
              uploadedIdType && uploadedIdType !== opt.type;
            return (
              <button
                key={opt.type}
                onClick={() => !uploadedIdType && setSelectedIdType(opt.type)}
                disabled={!!isOtherUploaded}
                className={cn(
                  'flex items-start gap-2.5 p-3 rounded-xl border-2 text-left transition-all',
                  isSelected && !isOtherUploaded
                    ? 'border-primary bg-primary/5'
                    : isOtherUploaded
                      ? 'border-border bg-muted/30 opacity-40 cursor-not-allowed'
                      : 'border-border hover:border-primary/50 cursor-pointer',
                )}
              >
                <div
                  className={cn(
                    'h-7 w-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5',
                    isSelected && !isOtherUploaded
                      ? 'bg-primary/10'
                      : 'bg-muted',
                  )}
                >
                  <CreditCard
                    className={cn(
                      'h-3.5 w-3.5',
                      isSelected && !isOtherUploaded
                        ? 'text-primary'
                        : 'text-muted-foreground',
                    )}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      'text-xs font-semibold',
                      isSelected && !isOtherUploaded
                        ? 'text-primary'
                        : 'text-foreground',
                    )}
                  >
                    {opt.label}
                  </p>
                  <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">
                    {opt.description}
                  </p>
                </div>
                {isUploaded && (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 ml-auto shrink-0 mt-1" />
                )}
              </button>
            );
          })}
        </div>
        <DocUploadCard
          type={activeOption.type}
          label={activeOption.label}
          description="Upload a clear, unobstructed photo or PDF"
          uploaded={uploadedTypes.has(activeOption.type)}
          onUploaded={onUploaded}
          allowReplace
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="h-5 w-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center shrink-0">
            2
          </span>
          <p className="text-xs font-semibold">Selfie holding your ID</p>
        </div>
        <DocUploadCard
          type="SELFIE"
          label="Selfie with ID"
          description="Hold your ID next to your face — both must be clearly visible"
          uploaded={uploadedTypes.has('SELFIE')}
          onUploaded={onUploaded}
          allowReplace
        />
      </div>
    </div>
  );
}

export default BasicUpgradeSection;
