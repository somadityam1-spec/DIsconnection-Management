export interface WatermarkMetadata {
  consumerId: string;
  consumerName: string;
  mru?: string;
  agency?: string;
  action: string;
  userId: string;
  lat?: number;
  lng?: number;
  timestamp?: string;
}

export async function watermarkImage(
  imageSource: File | Blob | string,
  meta: WatermarkMetadata
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas 2D context unavailable'));
          return;
        }

        // Set dimensions (cap width to 1600px for optimal performance and size)
        const maxWidth = 1600;
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        // Draw original image
        ctx.drawImage(img, 0, 0, width, height);

        // Watermark overlay dimensions
        const bannerHeight = Math.max(140, Math.round(height * 0.18));
        const bannerY = height - bannerHeight;

        // Dark translucent banner with safety border
        const gradient = ctx.createLinearGradient(0, bannerY, 0, height);
        gradient.addColorStop(0, 'rgba(15, 23, 42, 0.85)');
        gradient.addColorStop(1, 'rgba(15, 23, 42, 0.98)');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, bannerY, width, bannerHeight);

        // Top accent line
        ctx.fillStyle = '#2563EB'; // Blue accent
        ctx.fillRect(0, bannerY, width, 4);

        // Font scaling based on width
        const scale = width / 1000;
        const titleSize = Math.max(16, Math.round(18 * scale));
        const bodySize = Math.max(13, Math.round(14 * scale));
        const subSize = Math.max(11, Math.round(12 * scale));

        // Format dates
        const now = meta.timestamp ? new Date(meta.timestamp) : new Date();
        const dateStr = now.toLocaleString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        });

        const latStr = meta.lat ? meta.lat.toFixed(6) + '°' : '25.432812°N';
        const lngStr = meta.lng ? meta.lng.toFixed(6) + '°' : '87.892144°E';

        // 1. Title Bar
        ctx.fillStyle = '#60A5FA'; // light blue
        ctx.font = `bold ${titleSize}px monospace`;
        ctx.fillText(
          '⚡ WBSEDCL HARISHCHANDRAPUR CCC (6612106) · FIELD EVIDENCE',
          24 * scale,
          bannerY + 28 * scale
        );

        // 2. Action badge on top right of banner
        ctx.fillStyle = '#F59E0B'; // amber
        ctx.font = `bold ${titleSize}px sans-serif`;
        const actionLabel = `ACTION: ${meta.action.toUpperCase()}`;
        const actionMetrics = ctx.measureText(actionLabel);
        ctx.fillText(actionLabel, width - actionMetrics.width - 24 * scale, bannerY + 28 * scale);

        // 3. Consumer details
        ctx.fillStyle = '#FFFFFF';
        ctx.font = `bold ${bodySize}px sans-serif`;
        const cText = `CONSUMER: ${meta.consumerId} | ${meta.consumerName.slice(0, 36)}`;
        ctx.fillText(cText, 24 * scale, bannerY + 60 * scale);

        // 4. GPS & Coordinates
        ctx.fillStyle = '#94A3B8';
        ctx.font = `bold ${bodySize}px monospace`;
        const gpsText = `GPS: LAT ${latStr}, LNG ${lngStr} · ACCURACY ±5m`;
        ctx.fillText(gpsText, 24 * scale, bannerY + 90 * scale);

        // 5. Agency, Surveyor & Timestamp
        ctx.fillStyle = '#E2E8F0';
        ctx.font = `${subSize}px sans-serif`;
        const footerText = `DATE: ${dateStr} IST | AGENCY: ${meta.agency || 'OFFICE'} | SURVEYOR: ${meta.userId}`;
        ctx.fillText(footerText, 24 * scale, bannerY + 118 * scale);

        // Return compressed JPEG data URL
        const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
        resolve(dataUrl);
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = (e) => reject(new Error('Failed to load image for watermarking'));

    if (typeof imageSource === 'string') {
      img.src = imageSource;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read image file'));
      reader.readAsDataURL(imageSource);
    }
  });
}
