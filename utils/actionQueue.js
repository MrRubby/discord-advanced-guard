const queue = [];
let isProcessing = false;

async function processQueue() {
    if (queue.length === 0) {
        isProcessing = false;
        return;
    }
    
    isProcessing = true;
    const action = queue.shift();
    
    try {
        await action();
    } catch (error) {
        console.error('Kuyruk işlemi sırasında hata oluştu:', error);
    }
    
    // Rate limit yememek için bir sonraki işlemden önce 500ms bekle
    setTimeout(processQueue, 500);
}

function addToQueue(actionFunction) {
    queue.push(actionFunction);
    if (!isProcessing) {
        processQueue();
    }
}

module.exports = { addToQueue };
