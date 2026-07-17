function getNested(obj, path) {
    return path.split('.').reduce((o, k) => o?.[k], obj);
}

export async function translateData(lan) {
  try {
    const response = await fetch(`${window.location.origin}/data/lang/${lan}.json`);
    const file = await response.json();

    const elements = document.querySelectorAll("[idLan]");

    elements.forEach(el => {
      const key = el.getAttribute("idLan");
      const res = getNested(file, key);

      if (res !== undefined) {
        el.innerHTML = res;
      }
    });

  } catch (error) {
    console.error("Translation loading failed:", error);
  }
}