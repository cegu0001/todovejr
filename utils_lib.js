export function $(element) {
  return document.querySelector(element);
}

export async function loadJSON(url, callback) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Netværksfejl: ${response.status}`);
  }
  const jsonData = await response.json();
  callback(jsonData);
  return jsonData;
}
