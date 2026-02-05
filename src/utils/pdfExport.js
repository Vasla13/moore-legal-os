const nextFrame = () => new Promise((resolve) => requestAnimationFrame(() => resolve()));

const waitForFonts = async () => {
  if (document.fonts && document.fonts.ready) {
    try {
      await document.fonts.ready;
    } catch (err) {
      // Ignore font loading errors and continue with export.
    }
  }
};

const waitForImages = async (root) => {
  const images = Array.from(root.querySelectorAll('img'));
  if (images.length === 0) return;

  await Promise.all(
    images.map((img) => {
      if (img.complete && img.naturalWidth !== 0) return null;
      return new Promise((resolve) => {
        const done = () => resolve();
        img.addEventListener('load', done, { once: true });
        img.addEventListener('error', done, { once: true });
      });
    })
  );
};

const ensurePdfFilename = (filename) => {
  if (!filename) return 'document.pdf';
  return filename.toLowerCase().endsWith('.pdf') ? filename : `${filename}.pdf`;
};

export async function exportElementToPdf({
  elementId,
  filename,
  html2canvasOptions = {},
  imageOptions = {},
  jsPDFOptions = {},
  pagebreak = { mode: ['css', 'legacy'] }
}) {
  const element =
    typeof elementId === 'string' ? document.getElementById(elementId) : elementId;

  if (!element) {
    throw new Error('Élément PDF introuvable.');
  }

  const previousAttr = element.getAttribute('data-pdf-export');
  element.setAttribute('data-pdf-export', 'true');

  try {
    await nextFrame();
    await waitForFonts();
    await waitForImages(element);
    await nextFrame();

    const { default: html2pdf } = await import('html2pdf.js');
    const userOnclone = html2canvasOptions.onclone;

    const opt = {
      margin: 0,
      filename: ensurePdfFilename(filename),
      image: { type: 'jpeg', quality: 0.98, ...imageOptions },
      html2canvas: {
        scale: 2,
        useCORS: true,
        backgroundColor: '#000000',
        logging: false,
        scrollX: 0,
        scrollY: -window.scrollY,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
        ...html2canvasOptions,
        onclone: (doc) => {
          if (typeof userOnclone === 'function') {
            userOnclone(doc);
          }
        },
      },
      jsPDF: {
        unit: 'mm',
        format: 'a4',
        orientation: 'portrait',
        ...jsPDFOptions
      },
      pagebreak
    };

    await html2pdf().set(opt).from(element).save();
  } finally {
    if (previousAttr == null) element.removeAttribute('data-pdf-export');
    else element.setAttribute('data-pdf-export', previousAttr);
  }
}
