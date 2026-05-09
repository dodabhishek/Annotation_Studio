const API_BASE = '/detect';

export async function detectObjects(imageFile, prompt = 'person .') {
  const formData = new FormData();
  formData.append('image', imageFile);
  formData.append('prompt', prompt);

  const res = await fetch(API_BASE, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Detection failed (${res.status})`);
  }

  const data = await res.json();

  if (data.output_image) {
    data.outputImageUrl = `/output/${data.output_image}`;
    data.annotationData = data.detections
    console.log(data.annotationData)
  }

  return data;
}

export function getOutputImageUrl(filename) {
  return `/output/${filename}`;
}
