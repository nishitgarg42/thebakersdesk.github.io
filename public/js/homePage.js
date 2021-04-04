// datepicker
$('#birthDay').datepicker({
   "format" : "dd/mm/yyyy",
   "autoclose": true
});


// Parallax Scroll Effect

document.addEventListener("scroll", function(){
  const parallax = document.querySelector(".parallax-img-1");
  let scrollPosition = window.pageYOffset;
  parallax.style.transform = ("translateY(" + (scrollPosition * - .1) + "px");
});

document.addEventListener("scroll", function(){
  const parallax = document.querySelector(".parallax-img-2");
  let scrollPosition = window.pageYOffset;
  parallax.style.transform = ("translateY(" + (scrollPosition * - .1) + "px");
});
