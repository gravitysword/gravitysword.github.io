document.addEventListener('DOMContentLoaded', () => {
    const signElement = document.querySelector('.sign-0');

    signElement.addEventListener('mouseenter', () => {
        signElement.style.animation = 'eraseText 1s forwards';
        signElement.addEventListener('animationend', () => {
            signElement.style.animation = 'revealText 1s forwards';
        }, { once: true });
    });

    signElement.addEventListener('mouseleave', () => {
        signElement.style.animation = 'revealText 1s reverse forwards';
        signElement.addEventListener('animationend', () => {
            signElement.style.animation = 'eraseText 1s reverse forwards';
        }, { once: true });
    });
});