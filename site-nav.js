(function () {
  document.addEventListener("DOMContentLoaded", function () {
    var wrap = document.querySelector(".vx-nav-wrap");
    var toggle = document.querySelector(".vx-nav-toggle");
    var nav = document.getElementById("vxPrimaryNav");
    if (!wrap || !toggle || !nav) return;

    function setOpen(open) {
      wrap.classList.toggle("vx-nav-wrap--open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    }

    toggle.addEventListener("click", function () {
      setOpen(!wrap.classList.contains("vx-nav-wrap--open"));
    });

    var links = nav.querySelectorAll("a");
    for (var i = 0; i < links.length; i++) {
      links[i].addEventListener("click", function () {
        setOpen(false);
      });
    }

    window.addEventListener("resize", function () {
      if (window.innerWidth > 767) setOpen(false);
    });
  });
})();
