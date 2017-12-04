// alert('hare krishna');

var socket = io.connect('http://192.168.1.100:3500');

// query DOM
var message = document.getElementById('message');
// var handle = document.getElementById('handle');
var btn = document.getElementById('send');
var output = document.getElementById('output');
var feedback = document.getElementById('feedback');
var liUser = document.getElementById('liUser');

//scroll to bottom function
function updateScroll() {
    var element = document.getElementById("scrollDown");
    element.scrollTop = element.scrollHeight;
};

updateScroll();

//emit chat event
btn.addEventListener('click', () => {
    // alert('hare krishna');
    socket.emit('chat', {
        message: message.value,
        userko: liUser.innerHTML
    });

});

// emit typing event
message.addEventListener('keydown', function() {
    var userko = liUser.innerHTML;
    socket.emit('typing', userko);
});

//listen for chat events
socket.on('chat', (data) => {
    // alert(data);
    // alert(user);
    feedback.innerHTML = "";
    output.innerHTML += '<div><div class="commDiv"><p class="comment"><strong>' + data.userko + ': </strong>' + data.message + '</p></div></div>';
    updateScroll()
});

//listen for typing events
socket.on('typing', (data) => {
    // alert(current);
    updateScroll()
    feedback.innerHTML = '<p><em>' + data + ' is typing a message... </em></p>';
})