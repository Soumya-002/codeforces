document.addEventListener('DOMContentLoaded', function() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('nav');

    hamburger.addEventListener('click', function() {
        navMenu.classList.toggle('show'); // Toggle the "show" class on click
    });
});
