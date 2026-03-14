let deferredPrompt;
const installBtn = document.getElementById('pwa_install_btn');

window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent Chrome 67 and earlier from automatically showing the prompt
    e.preventDefault();
    // Stash the event so it can be triggered later.
    deferredPrompt = e;
    // Update UI to notify the user they can add to home screen
    if (installBtn) {
        installBtn.style.display = 'inline-flex';
        installBtn.classList.add('align-items-center', 'gap-2');
    }
});

if (installBtn) {
    installBtn.addEventListener('click', (e) => {
        if (!deferredPrompt) return;

        // Show the prompt
        deferredPrompt.prompt();
        // Wait for the user to respond to the prompt
        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('User accepted the A2HS prompt');
                installBtn.style.display = 'none';
            } else {
                console.log('User dismissed the A2HS prompt');
                installBtn.style.display = 'inline-flex';
            }
            deferredPrompt = null;
        });
    });
}

window.addEventListener('appinstalled', (evt) => {
    console.log('Soundset was installed');
    if (installBtn) {
        installBtn.style.display = 'none';
    }
});
