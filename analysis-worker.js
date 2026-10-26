import { analyzePCM } from './analysis.js?v=seiren-4';
self.onmessage = ({ data }) => {
  try {
    const result = analyzePCM(data.samples, data.sampleRate, progress => self.postMessage({ progress }));
    self.postMessage({ result });
  } catch (error) { self.postMessage({ error: error.message }); }
};
