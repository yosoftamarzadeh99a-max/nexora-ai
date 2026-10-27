"use strict";

document.addEventListener("DOMContentLoaded", () => {
    const searchInput = document.getElementById("searchInput");
    const toolsGrid = document.getElementById("toolsGrid");
    const toolsHeading = document.getElementById("toolsHeading");
    const toolsCount = document.getElementById("toolsCount");
    const emptyState = document.getElementById("emptyState");
    const categoryCards = document.querySelectorAll(".category-card");
    const toolCards = document.querySelectorAll(".tool-card");
    const menuToggle = document.getElementById("menuToggle");
    const sidebar = document.querySelector(".sidebar");

    let selectedCategory = "all";

    const categoryNames = {
        all: "همه ابزارها",
        chat: "چت و دستیار",
        image: "تولید تصویر",
        video: "تولید ویدئو",
        study: "آموزش و درس",
        code: "برنامه‌نویسی",
        audio: "موسیقی و صدا",
        home: "خانه هوشمند",
        work: "کار و بهره‌وری"
    };

    function normalizeText(value) {
        return String(value || "")
            .toLowerCase()
            .replace(/[يى]/g, "ی")
            .replace(/ك/g, "ک")
            .replace(/\u200c/g, " ")
            .trim();
    }

    function updateTools() {
        const query = normalizeText(searchInput.value);
        let visibleCount = 0;

        toolCards.forEach((card) => {
            const category = card.dataset.category || "";
            const searchData = normalizeText(
                card.innerText + " " + (card.dataset.search || "")
            );

            const matchesCategory =
                selectedCategory === "all" ||
                category === selectedCategory;

            const matchesSearch =
                query === "" || searchData.includes(query);

            const visible = matchesCategory && matchesSearch;

            card.hidden = !visible;

            if (visible) {
                visibleCount++;
            }
        });

        toolsHeading.textContent =
            query !== ""
                ? "نتایج جست‌وجو"
                : categoryNames[selectedCategory] || "ابزارها";

        toolsCount.textContent = visibleCount + " ابزار";

        emptyState.hidden = visibleCount !== 0;
        toolsGrid.hidden = visibleCount === 0;
    }

    function selectCategory(category) {
        selectedCategory = category;

        categoryCards.forEach((card) => {
            const active = card.dataset.category === category;

            card.classList.toggle("selected", active);
            card.setAttribute("aria-pressed", String(active));
        });

        updateTools();

        document.getElementById("favorites")
            .scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
    }

    categoryCards.forEach((card) => {
        card.setAttribute("aria-pressed", "false");

        card.addEventListener("click", () => {
            const category = card.dataset.category;

            if (category) {
                selectCategory(category);
            }
        });
    });

    if (searchInput) {
        searchInput.addEventListener("input", updateTools);

        searchInput.addEventListener("keydown", (event) => {
            if (event.key === "Escape") {
                searchInput.value = "";
                updateTools();
                searchInput.blur();
            }
        });
    }

    if (menuToggle && sidebar) {
        menuToggle.addEventListener("click", () => {
            const isOpen = sidebar.classList.toggle("open");

            menuToggle.setAttribute(
                "aria-expanded",
                String(isOpen)
            );
        });

        sidebar.querySelectorAll("a").forEach((link) => {
            link.addEventListener("click", () => {
                sidebar.classList.remove("open");
                menuToggle.setAttribute("aria-expanded", "false");
            });
        });

        document.addEventListener("click", (event) => {
            const clickedInsideSidebar =
                sidebar.contains(event.target);

            const clickedMenu =
                menuToggle.contains(event.target);

            if (
                window.innerWidth <= 760 &&
                !clickedInsideSidebar &&
                !clickedMenu
            ) {
                sidebar.classList.remove("open");
                menuToggle.setAttribute("aria-expanded", "false");
            }
        });
    }

    // پیوندهای منوی کناری
    document.querySelectorAll(".nav-item").forEach((link) => {
        link.addEventListener("click", () => {
            document.querySelectorAll(".nav-item")
                .forEach((item) => {
                    item.classList.remove("active");
                });

            link.classList.add("active");
        });
    });

    // شروع با نمایش تمام ابزارها
    updateTools();
});