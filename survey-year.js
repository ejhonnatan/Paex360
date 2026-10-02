export function selectedYear() {
  const value = Number(new URL(location.href).searchParams.get("year") || new Date().getFullYear());
  return Number.isInteger(value) && value >= 2026 && value <= 2100 ? value : 2026;
}
export function mountYearSelector(onChange) {
  const year = selectedYear();
  const label = document.createElement("label");
  label.textContent = "Año: ";
  label.style.cssText = "display:inline-flex;align-items:center;gap:8px;margin:12px 16px;";
  const select = document.createElement("select");
  select.id = "yearSelector";
  select.setAttribute("aria-label", "Año de la encuesta");
  select.style.cssText = "padding:8px 12px;border:1px solid #aaa;border-radius:4px;background:white;color:#111;";
  const lastYear = Math.min(2100, Math.max(new Date().getFullYear() + 2, year));
  for(let value = 2026; value <= lastYear; value++) select.add(new Option(String(value), String(value)));
  select.value = String(year);
  label.append(select);
  const anchor = document.querySelector(".survey-selector-wrap") || document.querySelector(".page");
  anchor.prepend(label);
  select.addEventListener("change", () => onChange(Number(select.value)));
  return select;
}
export function rememberYear(year) {
  const url = new URL(location.href);
  url.searchParams.set("year", year);
  history.replaceState(null, "", url);
}
export function navigateYear(year) {
  const url = new URL(location.href);
  url.searchParams.set("year", year);
  location.assign(url);
}
