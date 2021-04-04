

// When the user clicks on <span> (x), close the modal
$(".close")[0].onclick = function() {
  $("#myModal").css("display", "none");
}


// Event listioner and changing display property and setting image source
$(".zoomImage").click(function(){
  $("#myModal").css("display", "block");
  $("#img01").attr("src", this.src);
})
