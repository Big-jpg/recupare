// components/ui/file-uploader.tsx
"use client";

import { useDropzone } from "react-dropzone";
import { useCallback, useState } from "react";
import { toast } from "sonner";

export interface FileUploaderProps {
    onUploaded: (id: string, file: File) => void;
    disabled?: boolean;
}

export function FileUploader({
    onUploaded,
    disabled = false,
}: FileUploaderProps) {
    const [uploading, setUploading] = useState(false);

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();

            if (res.status === 409 || data.error?.includes("already exists")) {
                toast("⚠️ Invoice already exists in database, try another record.", {
                    description: file.name,
                });
                return;
            }

            if (res.ok && data.id) {
                toast("✅ Upload successful", {
                    description: `${file.name}`,
                });

                onUploaded(data.id, file);
            } else {
                throw new Error(data.error || "Unknown upload error");
            }
        } catch (err) {
            console.error("Upload failed:", err);
            toast("❌ Upload failed", { 
                description: (err as Error)?.message 
            });
        } finally {
            setUploading(false);
        }
    }, [onUploaded]);

    const { getRootProps, getInputProps } = useDropzone({
        onDrop,
        accept: { "application/pdf": [] },
        disabled: uploading || disabled,
        maxFiles: 1,
        multiple: false,
    });

    return (
        <div
            {...getRootProps()}
            className={`border-2 border-dashed p-6 rounded-lg w-full text-center cursor-pointer transition-all duration-150
        ${disabled ? "opacity-50 pointer-events-none" : "hover:bg-muted"}`}
            style={{ minHeight: "100px" }}
        >
            <input {...getInputProps()} />
            <p className="text-muted-foreground">
                {uploading
                    ? "📤 Uploading..."
                    : disabled
                        ? "File uploaded. Remove to select a new one."
                        : "📎 Drag & drop a PDF invoice here, or click to browse"}
            </p>
        </div>
    );
}

