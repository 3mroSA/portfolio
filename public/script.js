


const video = document.querySelector('.bg-video');
const revealElements = document.querySelectorAll('.reveal');
const scrollButton = document.getElementById('scrollDown');

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.15 }
);

revealElements.forEach((element) => observer.observe(element));

window.addEventListener('scroll', () => {
  const offset = window.scrollY;
  if (video) {
    video.style.transform = `translate(-50%, calc(-50% + ${offset * 0.5}px)) scale(1.15)`;
  }
});

if (scrollButton) {
  scrollButton.addEventListener('click', () => {
    const aboutSection = document.querySelector('#about');
    if (aboutSection) {
      aboutSection.scrollIntoView({ behavior: 'smooth' });
    }
  });
}



  const dot = document.querySelector(".cursor-dot");
  const outline = document.querySelector(".cursor-outline");

  let mouseX = 0;
  let mouseY = 0;

  let outlineX = 0;
  let outlineY = 0;

  window.addEventListener("mousemove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;

    dot.style.transform = `translate(${mouseX - 3}px, ${mouseY - 3}px)`;
  });

  function animate() {
    outlineX += (mouseX - outlineX) * 0.15;
    outlineY += (mouseY - outlineY) * 0.15;

    outline.style.transform = `translate(${outlineX - 15}px, ${outlineY - 15}px)`;

    requestAnimationFrame(animate);
  }


const search = new URLSearchParams(window.location.search);

if (search.get('sent')) {
  const notif = document.querySelector('.page-notice');
  if (notif) {
    const msg = notif.querySelector('.notif-msg');
    msg.textContent = "I’ve received your message and I’ll try my best to get back to you";
    notif.classList.add('visible');

    setTimeout(() => {
      notif.classList.remove('visible');
    }, 5000);

    setTimeout(() => {
      notif.style.display = 'none';
    }, 5260);
  }

  search.delete('sent');
  const newSearch = search.toString();
  const newUrl = window.location.pathname + (newSearch ? '?' + newSearch : '');
  history.replaceState(null, '', newUrl);
}


  animate();


