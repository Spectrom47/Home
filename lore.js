function toggleSection(id) {
    const sections = document.querySelectorAll(".lore-section");

    sections.forEach(section => {
        if (section.id === id) {
            section.classList.toggle("hidden");
        } else {
            section.classList.add("hidden");
        }
    });
}
