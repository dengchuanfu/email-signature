const defaultState = {
  name: "Monster",
  title: "IT工程师",
  department: "秘书处",
  email: "administrator@cenkersz.com",
  mobile: "183-2096-8656",
  address: "深圳市龙华区大浪街道恒大时尚慧谷6A-11层",
  company: "岑科科技（深圳）集团有限公司",
  website: "https://www.cenkersz.com",
  promoTitle: "岑科电感&变压器",
  promoSubtitle: "成为全球元器件解决方案提供商",
  ctaText: "更多>>",
  accent: "#5273ff",
  imageData: "http://yyby.top/upload/%E6%8A%96%E9%9F%B3%E5%A4%B4%E5%83%8F.png"
};

const ICONS = {
  email: "https://www.logosc.cn/email-signature-generator/_next/static/media/email.1d842d7e.png",
  mobile: "https://www.logosc.cn/email-signature-generator/_next/static/media/mobile.326f1fab.png",
  address: "https://www.logosc.cn/email-signature-generator/_next/static/media/address.cda8427d.png",
  company: "https://www.logosc.cn/email-signature-generator/_next/static/media/company.a55f2700.png",
  website: "https://www.logosc.cn/email-signature-generator/_next/static/media/website.bc473089.png"
};

const DEFAULT_IMAGE_PATH = "http://yyby.top/upload/%E6%8A%96%E9%9F%B3%E5%A4%B4%E5%83%8F.png";

const form = document.getElementById("signatureForm");
const previewRoot = document.getElementById("signaturePreview");
const htmlOutput = document.getElementById("htmlOutput");
const imageUpload = document.getElementById("imageUpload");
const copyHtmlButton = document.getElementById("copyHtmlButton");
const downloadHtmlButton = document.getElementById("downloadHtmlButton");
const resetButton = document.getElementById("resetButton");

const state = { ...defaultState };

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizeHex(value) {
  const trimmed = String(value).trim();
  return /^#[0-9a-fA-F]{6}$/.test(trimmed) ? trimmed : defaultState.accent;
}

function initialsFromName(name) {
  const chars = String(name).trim();

  if (!chars) {
    return "ES";
  }

  return chars.slice(0, 2).toUpperCase();
}

function createFallbackImage(name, accent) {
  const initials = initialsFromName(name);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="125" height="127" viewBox="0 0 125 127">
      <rect width="125" height="127" fill="#f3f5fb" rx="2" />
      <text x="50%" y="52%" dominant-baseline="middle" text-anchor="middle"
        font-family="Arial, sans-serif" font-size="34" font-weight="700" fill="${accent}">
        ${escapeHtml(initials)}
      </text>
    </svg>
  `.trim();

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function normalizeUrl(value) {
  const trimmed = String(value).trim();

  if (!trimmed) {
    return "";
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

function normalizeWebsiteLabel(value) {
  return String(value).trim().replace(/^https?:\/\//i, "");
}

function normalizeTel(value) {
  return String(value).trim().replace(/\s+/g, "");
}

function collectFormState() {
  const formData = new FormData(form);
  const accentTextValue = formData.get("accentText")?.toString().trim() || "";
  const accentPickerValue = formData.get("accent")?.toString().trim() || defaultState.accent;

  state.name = formData.get("name")?.toString().trim() || defaultState.name;
  state.title = formData.get("title")?.toString().trim() || defaultState.title;
  state.department = formData.get("department")?.toString().trim() || defaultState.department;
  state.email = formData.get("email")?.toString().trim() || "";
  state.mobile = formData.get("mobile")?.toString().trim() || "";
  state.address = formData.get("address")?.toString().trim() || "";
  state.company = formData.get("company")?.toString().trim() || "";
  state.website = formData.get("website")?.toString().trim() || "";
  state.promoTitle = formData.get("promoTitle")?.toString().trim() || "";
  state.promoSubtitle = formData.get("promoSubtitle")?.toString().trim() || "";
  state.ctaText = formData.get("ctaText")?.toString().trim() || "";
  state.accent = /^#[0-9a-fA-F]{6}$/.test(accentTextValue)
    ? accentTextValue
    : normalizeHex(accentPickerValue);

  form.querySelector('input[name="accent"]').value = state.accent;
  form.querySelector('input[name="accentText"]').value = state.accent;
}

function currentImageSource() {
  return state.imageData || createFallbackImage(state.name, state.accent);
}

function buildIcon(url) {
  return `<img src="${url}" style="display: inline; outline: 0; border: none; text-decoration: none; height: 14px; vertical-align: -3px; width: 14px; background: ${state.accent}; margin-right: 4px;" />`;
}

function buildSignatureHtml() {
  const imageSource = currentImageSource();
  const roleText = [state.title, state.department].filter(Boolean).join(" | ");
  const websiteUrl = normalizeUrl(state.website);
  const websiteLabel = normalizeWebsiteLabel(state.website);
  const telHref = normalizeTel(state.mobile);

  return `<table border="0" cellpadding="0" style="font-family: Palatino; font-size: 16px; margin-left: 0; margin-right: auto; width: 440px;" width="100%">
<tbody>
<tr>
<td>
<table border="0" cellpadding="0" style="margin-bottom: 10px; margin-left: 0; margin-right: auto; width: auto;" width="100%">
<tbody>
<tr>
<td style="padding-right: 20px; border-right: 3px solid ${state.accent};"><img src="${escapeHtml(imageSource)}" width="125" height="127" style="user-select: none;" /></td>
<td style="padding-left: 20px;">
<h3 style="font-size: 1.125em; font-weight: bold; line-height: 1.75; margin: 0; color: ${state.accent};">${escapeHtml(state.name)}</h3>
<p style="font-size: .75em; line-height: 1; margin: 0 0 12px;">${escapeHtml(roleText)}</p>
<p style="font-size: .75em; line-height: 2; margin: 0;">${buildIcon(ICONS.email)}<a href="mailto:${escapeHtml(state.email)}" style="color: #333; text-decoration: none;">${escapeHtml(state.email)}</a></p>
<p style="font-size: .75em; line-height: 2; margin: 0;">${buildIcon(ICONS.mobile)}<a href="tel:${escapeHtml(telHref)}" style="color: #333; text-decoration: none;">${escapeHtml(state.mobile)}</a></p>
</td>
</tr>
</tbody>
</table>
<div>
<p style="font-size: .75em; line-height: 2; margin: 0;">${buildIcon(ICONS.address)}${escapeHtml(state.address)}</p>
</div>
<table border="0" cellpadding="0" style="margin-left: 0; margin-right: auto; width: auto;" width="100%">
<tbody>
<tr>
<td style="padding-right: 26px;">
<p style="font-size: .75em; line-height: 2; margin: 0;">${buildIcon(ICONS.company)}${escapeHtml(state.company)}</p>
</td>
<td>
<p style="font-size: .75em; line-height: 2; margin: 0;">${buildIcon(ICONS.website)}<a href="${escapeHtml(websiteUrl)}" style="color: #333; text-decoration: none;" target="_blank" rel="noopener">${escapeHtml(websiteLabel)}</a></p>
</td>
</tr>
</tbody>
</table>
<table border="0" cellpadding="0" style="font-size: 14px; height: 72px; background: #f4f4f4; border-radius: 2px; font-family: Arial; margin-top: 10px;" width="100%">
<tbody>
<tr>
<td style="padding-left: 15px;">
<p style="font-weight: bold; margin: 0 0 4px;">${escapeHtml(state.promoTitle)}</p>
<p style="font-size: 12px; margin: 0;">${escapeHtml(state.promoSubtitle)}</p>
</td>
<td style="padding-right: 30px; text-align: right;"><a href="${escapeHtml(websiteUrl)}" style="color: #333; text-decoration: none;" target="_blank" rel="noopener"><span style="background: ${state.accent}; border-radius: 4px; color: #fff; display: inline-block; line-height: 32px; padding: 0 24px;">${escapeHtml(state.ctaText)}</span></a></td>
</tr>
</tbody>
</table>
</td>
</tr>
</tbody>
</table>`;
}

function renderPreview() {
  const html = buildSignatureHtml();
  previewRoot.innerHTML = html;
  htmlOutput.value = html;
}

async function loadDefaultImage() {
  try {
    const response = await fetch(DEFAULT_IMAGE_PATH);

    if (!response.ok) {
      return;
    }

    const blob = await response.blob();
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";

      if (!result) {
        return;
      }

      defaultState.imageData = result;

      if (!state.imageData) {
        state.imageData = result;
        renderPreview();
      }
    };
    reader.readAsDataURL(blob);
  } catch (error) {
    // Keep the initials fallback when the local image cannot be loaded.
  }
}

function resetForm() {
  form.reset();
  state.imageData = defaultState.imageData;
  imageUpload.value = "";
  form.querySelector('input[name="accent"]').value = defaultState.accent;
  form.querySelector('input[name="accentText"]').value = defaultState.accent;
  collectFormState();
  renderPreview();
}

function downloadHtml() {
  const blob = new Blob([htmlOutput.value], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "email-signature.html";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

async function copyHtml() {
  try {
    await navigator.clipboard.writeText(htmlOutput.value);
  } catch (error) {
    htmlOutput.focus();
    htmlOutput.select();
    document.execCommand("copy");
  }

  copyHtmlButton.textContent = "已复制";
  window.setTimeout(() => {
    copyHtmlButton.textContent = "复制 HTML";
  }, 1500);
}

form.addEventListener("input", (event) => {
  if (event.target.name === "accent") {
    form.querySelector('input[name="accentText"]').value = event.target.value;
  }

  collectFormState();
  renderPreview();
});

imageUpload.addEventListener("change", (event) => {
  const [file] = event.target.files || [];

  if (!file) {
    state.imageData = defaultState.imageData;
    renderPreview();
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    state.imageData = typeof reader.result === "string" ? reader.result : "";
    renderPreview();
  };
  reader.readAsDataURL(file);
});

copyHtmlButton.addEventListener("click", copyHtml);
downloadHtmlButton.addEventListener("click", downloadHtml);
resetButton.addEventListener("click", resetForm);

collectFormState();
renderPreview();
loadDefaultImage();
