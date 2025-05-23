// Sistema di navigazione tra stanze
const totalRooms = 7;
let currentRoom;
let seconds = 0;
let timerInterval;

let hintCount = parseInt(sessionStorage.getItem('hintCount')) || 3;
sessionStorage.setItem('hintCount', hintCount);

let q1 = sessionStorage.getItem('q1') == 'true';
let q2 = sessionStorage.getItem('q2') == 'true';
let q3 = sessionStorage.getItem('q3') == 'true';



$(document).ready(function () {
    // ✅ Imposta l'orario d'inizio solo una volta
    if (!localStorage.getItem('escapeRoomStartTime')) {
        localStorage.setItem('escapeRoomStartTime', Date.now());
    }

    // Determina la stanza corrente dal percorso
    const pathParts = window.location.pathname.split('/');
    const roomPart = pathParts[pathParts.length - 2];
    if (roomPart && roomPart.startsWith('room')) {
        currentRoom = parseInt(roomPart.replace('room', ''));
    }

    loadProgress();
    startTimer();
    $("#hintCount").text(hintCount);

    // PRIMO QUIZ - BIT DI PARITÀ
    function calcolaParita(stringa) {
        let uno = (stringa.match(/1/g) || []).length;
        return uno % 2 === 0 ? "0" : "1";
    }

    const suggerimenti = [
        "Inizia contando quanti '1' ci sono nella stringa.",
        "Se il numero totale di '1' è pari (es. 2, 4, 6...), allora la parità è pari (0). Se è dispari (es. 1, 3, 5...), la parità è dispari (1).",
        "Verifica il conteggio: un solo errore cambia completamente il risultato."
    ];

    $(".domanda").each(function () {
        let stringa = $(this).find(".stringa-bit").text();
        let rispostaCorretta = calcolaParita(stringa);
        $(this).attr("data-risposta", rispostaCorretta);
    });

    $(".opzione").on("click", function () {
        const contenitore = $(this).closest(".opzioni");
        contenitore.find(".opzione").removeClass("selezionata");
        $(this).addClass("selezionata");
    });

    $("#verifica").on("click", function () {
        let corrette = true;
        $(".domanda").each(function () {
            const selezionata = $(this).find(".opzione.selezionata");
            if (!selezionata.length || selezionata.data("valore").toString() !== $(this).attr("data-risposta")) {
                corrette = false;
            }
        });

        if (corrette) {
            $("#risultato").text("🎉 Tutte le risposte sono corrette!").css("color", "green");
            q1 = true;
            sessionStorage.setItem('q1', true);
        } else {
            $("#risultato").text("❌ Alcune risposte sono sbagliate. Riprova!").css("color", "red");
        }
    });

    let indice = 0;
    $("#mostra-indizio").on("click", function () {
        if (hintCount > 0 && indice < suggerimenti.length) {
            $("#area-indizi").append("<p class='indizio'>" + suggerimenti[indice] + "</p>");
            hintCount--;
            indice++;
            sessionStorage.setItem('hintCount', hintCount);
            $("#hintCount").text(hintCount);
        } else {
            $(this).prop("disabled", true).text("Tutti gli indizi sono stati mostrati");
        }
    });

    // SECONDO QUIZ - DRAG & DROP
    let draggedId = null;

    $('.dragtarget').on('dragstart', function (ev) {
        draggedId = ev.target.id;
        ev.originalEvent.dataTransfer.setData("text/plain", draggedId);
    });

    $('.box, .dropzone').on('dragover', function (ev) {
        ev.preventDefault();
    });

    $('.box, .dropzone').on('drop', function (ev) {
        ev.preventDefault();
        const draggedEl = document.getElementById(draggedId);
        const targetBox = this;
        const existingChild = $(targetBox).children('.dragtarget')[0];

        if (existingChild && existingChild.id != draggedId) {
            const sourceBox = draggedEl.parentElement;
            targetBox.replaceChild(draggedEl, existingChild);
            sourceBox.appendChild(existingChild);
        } else {
            targetBox.appendChild(draggedEl);
        }
    });

    $('#vis').click(() => {
        let str = "";
        for (let i = 1; i <= 14; i++) {
            const text = $("#zn" + i).find("p").text();
            str += text;
        }
        if (str == "06h01h02h03h04h05h0Ah 06h07h08h09h0Ah 0Ah06h") {
            $("#feedback").text("Combinazione corretta!!").css("color", "#32CD32");
            q2 = true;
            sessionStorage.setItem('q2', true);
        } else {
            $("#feedback").text("Sono presenti degli errori, rivedi qualcosa!").css("color", "#FF0000");
        }
    });

    $('#hint').click(() => {
        if (hintCount > 0) {
            hintCount--;
            sessionStorage.setItem('hintCount', hintCount);
            $("#hintCount").text(hintCount);
            const messaggi = [
                "Indizio 1: Cerca di posizionare '06h' vicino a '01h'.",
                "Indizio 2: La sequenza corretta inizia con '06h'.",
                "Indizio 3: La posizione finale di '0Ah' è molto importante!"
            ];
            $("#feedback").text(messaggi[2 - hintCount] || "Nessun altro indizio").css("color", "#FFA07A");
            if (hintCount == 0) $("#hint").attr("disabled", true);
        }
    });

    // TERZO QUIZ - FORM
    const risposteCorrette = { d1: 'B', d2: 'B', d3: 'B', d4: 'A', d5: 'A' };
    const indizi = {
        d1: "Indizio: Guarda il numero che identifica ogni dispositivo di rete, non è un IP ma qualcosa di fisico sulla scheda di rete.",
        d2: "Indizio: È una unità di dati che trasporta le informazioni sulla rete. ",
        d3: "Indizio: Quando la rete è occupata, devi aspettare il tuo turno.",
        d4: "Indizio: Se i dati arrivano danneggiati, vengono ritrasmessi.",
        d5: "Indizio: È il formato di dati che include dati e controllo."
    };
    const aiutiUsati = {};

    $('#invia-risposte').click(function () {
        let punteggio = 0;
        let domandeSbagliate = [];
        Object.keys(risposteCorrette).forEach(id => {
            const risposta = $("input[name='" + id + "']:checked").val();
            if (risposta === risposteCorrette[id]) {
                punteggio++;
            } else {
                domandeSbagliate.push(id);
            }
        });

        $('#risultato').show();

        if (punteggio === 5) {
            $('#risultato').text("Complimenti! Hai risposto correttamente a tutte le domande.").css('color', '#4CAF50');
            q3 = true;
            sessionStorage.setItem('q3', true);
        } else {
            $('#risultato').text(`Hai ${punteggio} risposte corrette su 5.`).css('color', '#FF3B3F');
        }
    });

    $('#aiuto').click(() => {
        if (hintCount <= 0) {
            $('#testo-aiuto').html("Hai esaurito i tentativi di aiuto!");
            $('#messaggio-aiuto').show();
            return;
        }
        let trovato = false;
        for (let id in indizi) {
            if (!$(`input[name='${id}']:checked`).length && !aiutiUsati[id]) {
                $('#testo-aiuto').html(indizi[id]);
                aiutiUsati[id] = true;
                hintCount--;
                sessionStorage.setItem('hintCount', hintCount);
                $('#hintCount').text(hintCount);
                trovato = true;
                break;
            }
        }

        if (!trovato) $('#testo-aiuto').html("Hai già risposto o ricevuto aiuto per tutte le domande.");

        $('#messaggio-aiuto').show();
    });

    // Gestione passaggio stanza
    $('#passa').click(() => {
        if (q1 && q2 && q3) {
            checkAndProceed();
        } else {
            alert("Completa tutti i quiz prima di procedere!");
        }
    });
     
    if (sessionStorage.getItem('q1') == 'true') {
        $(".a1").html("<img class='i1' src='images/spunta.png'>");
    } else {
        $(".a1").html("<a href='bit di parita.html'><img class='i1' src='images/croce.png'></a>");
    }

    if (sessionStorage.getItem('q2') == 'true') {
        $(".a2").html("<img class='i1' src='images/spunta.png'>");
    } else {
        $(".a2").html("<a href='drag.html'><img class='i1' src='images/croce.png'></a>");
    }

    if (sessionStorage.getItem('q3') == 'true') {
        $(".a3").html("<img class='i1' src='images/spunta.png'>");
    } else {
        $(".a3").html("<a href='form.html'><img class='i1' src='images/croce.png'></a>");
    }
    
});




// Verifica completamento e passaggio alla stanza successiva
function checkAndProceed() {
    if (typeof checkCompletion === 'function' && checkCompletion()) {
        // Mostra messaggio di successo
        $(".success-message").fadeIn();
              // Salva il progresso alla stanza successiva
        saveProgress(Math.max(currentRoom + 1, localStorage.getItem('escapeRoomProgress')));

        // Naviga alla prossima stanza o alla vittoria
        if (currentRoom < totalRooms) {
            setTimeout(function() {
                window.location.href = '../room' + (currentRoom + 1) + '/index.html';
            }, 3000);
        } else {
            // Calcola e salva le statistiche
            const startTime = localStorage.getItem('escapeRoomStartTime');
            const elapsedTime = startTime ? Math.floor((Date.now() - startTime) / 1000) : seconds;
            localStorage.setItem('escapeRoomCompletionTime', elapsedTime);
            
            // Vai alla pagina di vittoria
            setTimeout(function() {
                window.location.href = '../../victory.html';
            }, 3000);
        }
    }
}

// Funzioni per salvare/caricare progressi
function saveProgress(roomNumber) {
    localStorage.setItem('escapeRoomProgress', roomNumber);
}

function loadProgress() {
    // Se non esiste un progresso, inizializza a 1
   if (!localStorage.getItem('escapeRoomProgress')) {
        localStorage.setItem('escapeRoomProgress', 1);
    }
}

// Sistema timer
function startTimer() {
    // Carica il tempo totale dall'inizio
    const startTime = localStorage.getItem('escapeRoomStartTime');
    if (startTime) {
        seconds = Math.floor((Date.now() - parseInt(startTime)) / 1000);
    }
    
    // Aggiorna il timer ogni secondo
    timerInterval = setInterval(function() {
        seconds++;
        updateTimerDisplay();
    }, 1000);
    
    // Aggiorna il display immediatamente
    updateTimerDisplay();
}

function updateTimerDisplay() {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    const timeString = 
        (hours > 0 ? (hours < 10 ? '0' : '') + hours + ':' : '') +
        (minutes < 10 ? '0' : '') + minutes + ':' +
        (remainingSeconds < 10 ? '0' : '') + remainingSeconds;
    
    $("#timer").text(timeString);
}
