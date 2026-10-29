const API_URL = "/api-backend";
const WSO2_URL = "/api-wso2";

export async function fetchProducts() {
  const response = await fetch(`${API_URL}/api/v1/products`);
  if (!response.ok) throw new Error(`Erreur API: ${response.status}`);
  return await response.json();
}

export async function checkBackendHealth() {
  try {
    const response = await fetch(`${API_URL}/health`);
    return response.ok;
  } catch {
    return false;
  }
}

export async function saveProduct(product, id = null) {
  const method = id ? "PUT" : "POST";
  const url = id ? `${API_URL}/api/v1/products/${id}` : `${API_URL}/api/v1/products`;
  
  const response = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(product)
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `Erreur ${response.status}`);
  }
  return await response.json();
}

export async function deleteProduct(id) {
  const response = await fetch(`${API_URL}/api/v1/products/${id}`, { method: "DELETE" });
  if (!response.ok) throw new Error(`Suppression impossible: ${response.status}`);
  return true;
}

export async function syncProduct(sku) {
  const response = await fetch(`${WSO2_URL}/products/transfer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sku })
  });
  
  const text = await response.text();
  if (!response.ok) throw new Error(`${response.status} - ${text}`);
  return text;
}
