import axios from 'axios';

const API_BASE = '/detect';

export async function detectObjects(imageFile, prompt = 'person .') {
  const formData = new FormData();
  formData.append('image', imageFile);
  formData.append('prompt', prompt);

  let data;
  try {
    const res = await axios.post(API_BASE, formData);
    data = res.data;
  } catch (error) {
    const errMessage = error.response?.data?.error || `Detection failed (${error.response?.status || 'Unknown'})`;
    throw new Error(errMessage);
  }

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

export async function detectSamPoint(imageFile, x, y) {
  const formData = new FormData();
  formData.append('image', imageFile);
  formData.append('x', x);
  formData.append('y', y);

  try {
    const res = await axios.post('/sam/point', formData);
    return res.data.points;
  } catch (error) {
    const errMessage = error.response?.data?.error || `SAM point detection failed (${error.response?.status || 'Unknown'})`;
    throw new Error(errMessage);
  }
}
