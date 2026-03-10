import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { Camera, CameraOff } from "lucide-react";

interface CameraScannerProps {
  onScan: (code: string) => void;
}

export function CameraScanner({ onScan }: CameraScannerProps) {
  const [active, setActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerId = "camera-scanner-container";

  const start = async () => {
    setError(null);
    try {
      const scanner = new Html5Qrcode(containerId);
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 280, height: 120 } },
        (decodedText) => {
          onScan(decodedText);
        },
        () => {}
      );
      setActive(true);
    } catch (err: any) {
      setError("ไม่สามารถเปิดกล้องได้ — กรุณาอนุญาตการเข้าถึงกล้อง");
      setActive(false);
    }
  };

  const stop = async () => {
    try {
      if (scannerRef.current?.isScanning) {
        await scannerRef.current.stop();
      }
      scannerRef.current?.clear();
    } catch {}
    scannerRef.current = null;
    setActive(false);
  };

  useEffect(() => {
    return () => {
      stop();
    };
  }, []);

  return (
    <div className="space-y-3">
      <Button
        variant={active ? "destructive" : "outline"}
        size="sm"
        onClick={active ? stop : start}
        type="button"
      >
        {active ? (
          <><CameraOff className="h-4 w-4 mr-1" /> ปิดกล้อง</>
        ) : (
          <><Camera className="h-4 w-4 mr-1" /> สแกนด้วยกล้อง</>
        )}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div
        id={containerId}
        className={`rounded-lg overflow-hidden border border-border ${active ? "block" : "hidden"}`}
        style={{ maxWidth: 400 }}
      />
    </div>
  );
}
