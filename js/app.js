function navigateTo(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(pageId).classList.add('active');
    window.scrollTo(0, 0);
}

document.addEventListener('DOMContentLoaded', () => {
    var acc = document.getElementsByClassName("accordion");
    for (var i = 0; i < acc.length; i++) {
        acc[i].addEventListener("click", function() {
            this.classList.toggle("active");
            var panel = this.nextElementSibling;
            if (panel.style.maxHeight) {
                panel.style.maxHeight = null;
                panel.classList.remove("active");
            } else {
                var allPanels = document.querySelectorAll('.panel');
                allPanels.forEach(p => {
                    p.style.maxHeight = null;
                    p.classList.remove("active");
                });
                var allAccordions = document.querySelectorAll('.accordion');
                allAccordions.forEach(a => a.classList.remove('active'));

                this.classList.add("active");
                panel.classList.add("active");
                panel.style.maxHeight = panel.scrollHeight + "px";
            } 
        });
    }
});
