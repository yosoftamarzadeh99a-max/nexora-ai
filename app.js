const aiTools = [
{
name: "ChatGPT",
category: "chat",
description: "دستیار هوشمند برای گفتگو، یادگیری و نوشتن.",
url: "https://chatgpt.com/"
},
{
name: "Google Gemini",
category: "chat",
description: "دستیار هوش مصنوعی گوگل.",
url: "https://gemini.google.com/"
},
{
name: "Microsoft Copilot",
category: "chat",
description: "دستیار هوشمند مایکروسافت.",
url: "https://copilot.microsoft.com/"
},
{
name: "Adobe Firefly",
category: "image",
description: "ابزارهای هوش مصنوعی برای ساخت و ویرایش تصویر.",
url: "https://firefly.adobe.com/"
},
{
name: "Canva AI",
category: "image",
description: "ابزارهای طراحی و تولید محتوای تصویری.",
url: "https://www.canva.com/"
},
{
name: "Runway",
category: "video",
description: "ابزارهای هوش مصنوعی برای تولید و ویرایش ویدیو.",
url: "https://runwayml.com/"
},
{
name: "Khan Academy",
category: "study",
description: "منابع آموزشی و ابزارهای یادگیری.",
url: "https://www.khanacademy.org/"
},
{
name: "GitHub Copilot",
category: "code",
description: "دستیار برنامه‌نویسی برای نوشتن و بررسی کد.",
url: "https://github.com/features/copilot"
},
{
name: "Suno",
category: "audio",
description: "ابزار هوش مصنوعی برای ساخت موسیقی.",
url: "https://suno.com/"
},
{
name: "Zapier",
category: "work",
description: "خودکارسازی کارها و اتصال سرویس‌های مختلف.",
url: "https://zapier.com/"
},
{
name: "Smart Home Guide",
category: "home",
description: "راهنمای آشنایی با خانه هوشمند و ابزارهای مرتبط.",
url: "https://www.home-assistant.io/"
}
];

const toolsContainer = document.getElementById("tools");
const searchInput = document.getElementById("search");
const resultTitle = document.getElementById("resultTitle");
const categoryButtons = document.querySelectorAll("[data-category]");

let selectedCategory = "all";

function renderTools() {
const query = searchInput.value.trim().toLowerCase();

const filteredTools = aiTools.filter(tool => {
const matchesCategory =
selectedCategory === "all" ||
tool.category === selectedCategory;

const searchableText =
  `${tool.name} ${tool.description} ${tool.category}`.toLowerCase();

return matchesCategory && searchableText.includes(query);

});

toolsContainer.replaceChildren();

if (filteredTools.length === 0) {
const message = document.createElement("p");
message.className = "empty";
message.textContent = "ابزاری پیدا نشد؛ عبارت دیگری جستجو کن.";
toolsContainer.appendChild(message);
return;
}

filteredTools.forEach(tool => {
const card = document.createElement("article");
card.className = "tool-item";

const heading = document.createElement("h3");
heading.textContent = tool.name;

const description = document.createElement("p");
description.textContent = tool.description;

const link = document.createElement("a");
link.href = tool.url;
link.target = "_blank";
link.rel = "noopener noreferrer";
link.textContent = "ورود به ابزار ←";

card.append(heading, description, link);
toolsContainer.appendChild(card);

});
}

categoryButtons.forEach(button => {
button.addEventListener("click", () => {
selectedCategory = button.dataset.category;
resultTitle.textContent =
button.querySelector("b").textContent;

renderTools();

document.querySelector(".results").scrollIntoView({
  behavior: "smooth",
  block: "start"
});

});
});

searchInput.addEventListener("input", renderTools);

renderTools();
