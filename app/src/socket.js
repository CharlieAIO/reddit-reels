import { io } from 'socket.io-client';

let socket = null;

// Helper function to connect to the socket
const connectSocket = (accessToken, refreshToken) => {
    if (socket) {
        socket.disconnect();
    }
    socket = io.connect(process.env.REACT_APP_WS, {
        transports: ['websocket'],
        upgrade: false,
        auth: {
            token: accessToken || null,
            refreshToken: refreshToken || null
        }
    });
    setUpHandlers();
};

// Event handler for accessTokenRefresh
const handleAccessTokenRefresh = (data) => {
    const newAccessToken = data.token;
    console.log('Received new access token:', newAccessToken);
    localStorage.setItem('accessToken', newAccessToken);
    // Update the token in the socket's authentication object
    if (socket && socket.auth) {
        socket.auth.token = newAccessToken;
    }
};

// Set up event handlers
const setUpHandlers = () => {
    socket.on('accessTokenRefresh', handleAccessTokenRefresh);
};

// Initial connection setup
if (!localStorage.getItem('accessToken')) {
    if (window.location.pathname !== '/login' && !['/tos', '/privacy'].includes(window.location.pathname.toLowerCase())) {
        window.location.href = '/login';
    }
} else {
    connectSocket(localStorage.getItem('accessToken'), localStorage.getItem('refreshToken'));
}

export const signout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    if (window.location.pathname !== '/login') {
        window.location.href = '/login';
    }
};

export const resetPasswordRequest = (email) => {
    return new Promise((resolve) => {
        connectSocket(null, null);  // Connecting without tokens
        socket.emit('reset-password-request', email);
        socket.on('reset-password-request', (data) => {
            return resolve(data);
        })
    });
}

export const resetPassword = (data) => {
    return new Promise((resolve) => {
        connectSocket(null, null);  // Connecting without tokens
        socket.emit('reset-password', data);
        socket.on('reset-password', (data) => {
            return resolve(data);
        })
    });
}


export const verifyResend = (email) => {
    return new Promise((resolve) => {
        connectSocket(null, null);  // Connecting without tokens
        socket.emit('verify-resend', email);
        socket.on('verify-resend', (data) => {
            return resolve(data);
        })
    });
}

export const socketLogin = (data) => {
    return new Promise((resolve) => {
        connectSocket(null, null);  // Connecting without tokens for the login process
        socket.emit('login', data);
        socket.on('login', (data) => {
            if (data.status === 'success') {

                if (data?.verified) {
                    localStorage.setItem('accessToken', data.accessToken);
                    localStorage.setItem('refreshToken', data.refreshToken);
                    connectSocket(data.accessToken, data.refreshToken);
                }
                resolve(data);
            } else {
                resolve(data);
            }
        });
    });
};

export const socketSignup = (signupData) => {
    return new Promise((resolve) => {
        connectSocket(null, null);  // Connecting without tokens for the signup process
        socket.emit('signup', signupData)
        socket.on('signup', (data) => {
            if (data?.status === "success") {
                resolve(true)
            } else {
                resolve(data?.message)
            }
        })
    })
}


export const uploadVideo = (file, cropVideo, onProgress) => {
    return new Promise(async (resolve, reject) => {
        const CHUNK_SIZE = 0.5 * 1024 * 1024; // 0.5MB
        const filePath = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + '.mp4';
        const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

        const uploadChunk = async (chunk, chunkNumber) => {
            return new Promise((resolveChunk, rejectChunk) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const retryMax = 3;
                    let retries = 0;

                    const sendChunk = () => {
                        socket.emit('upload-chunk', e.target.result, (response) => {
                            if (response && response.status === 'success') {
                                const percentageComplete = Math.round(((chunkNumber + 1) / totalChunks) * 100).toFixed(2) + '%';
                                onProgress(percentageComplete);
                                console.log(`Chunk ${chunkNumber + 1}/${totalChunks} uploaded`, chunk.size, 'bytes');
                                resolveChunk();
                            } else if (retries < retryMax) {
                                retries++;
                                console.log(`Retry ${retries} for chunk ${chunkNumber + 1}`);
                                sendChunk();
                            } else {
                                rejectChunk(`Failed to upload chunk ${chunkNumber + 1}`);
                            }
                        });
                    };
                    sendChunk();
                };
                reader.readAsArrayBuffer(chunk);
            });
        };

        socket.emit('start-upload', filePath);

        for (let i = 0; i < totalChunks; i++) {
            const start = CHUNK_SIZE * i;
            const end = Math.min(CHUNK_SIZE * (i + 1), file.size);
            const chunk = file.slice(start, end);

            try {
                await uploadChunk(chunk, i);
            } catch (error) {
                console.error(error);
                return reject('failed');
            }
        }

        console.log('all chunks uploaded');
        socket.emit('end-upload', { fileName: file.name, filePath: filePath, crop: cropVideo }, (response) => {
            if (response.status === 'success') {
                resolve('success');
            } else {
                reject('failed');
            }
        });
    });
};


export const deleteVideo = (file) => {
    return new Promise((resolve, reject) => {
        socket.emit('delete-video', file, (result) => {
            if (result.status === 'success') {
                return resolve('success');
            } else {
                return reject('failed');
            }
        });
    });
}



export const downloadVideo = async (file, onProgress) => {
    function base64ToBlob(base64, mimeType = '') {
        const byteChars = atob(base64);
        const byteNumbers = new Array(byteChars.length);
        for (let i = 0; i < byteChars.length; i++) {
            byteNumbers[i] = byteChars.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        return new Blob([byteArray], { type: mimeType });
    }

    return new Promise((resolve, reject) => {
        // Create a named function for handling the download response.
        const downloadResponseHandler = (response) => {
            if (response.status === 'downloading') {
                const chunk = base64ToBlob(response.data);
                chunks.push(chunk);
                receivedSize += chunk.size;
                totalSize = response.totalSize;

                // Update the progress bar.
                const progress = (receivedSize / totalSize) * 100;
                onProgress(progress.toFixed(2) + '%');
            }

            if (response.status === 'complete' || response.status === 'error') {
                // Remove this event listener
                socket.off('download-response', downloadResponseHandler);

                if (response.status === 'complete') {
                    const blob = new Blob(chunks, { type: 'video/mp4' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.id = `download-${Date.now()}`;
                    a.href = url;
                    a.download = response.filename || `downloaded_video_${Date.now()}.mp4`;
                    document.body.appendChild(a); // Required for Firefox
                    a.click();
                    document.body.removeChild(a); // Cleanup for Firefox

                    return resolve('success');
                } else {
                    return reject('failed');
                }
            }
        };

        // Attach the event listener
        socket.on('download-response', downloadResponseHandler);

        // Emit the download event
        socket.emit('download-video', file);

        let receivedSize = 0; // Keep track of how much data has been received.
        let totalSize = 0;
        const chunks = []; // Store the received chunks.
    });
}


export const uploadFont = (file) => {
    return new Promise((resolve, reject) => {
        const CHUNK_SIZE = 0.5 * 1024 * 1024; // 0.5MB
        const filePath = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + `.${file.name.split('.')[1]}`
        const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

        const uploadChunk = (chunk) => {
            return new Promise((resolveChunk) => {
                const reader = new FileReader();
                const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

                reader.onload = async (e) => {
                    socket.emit('upload-chunk-font', e.target.result, () => {
                        resolveChunk();
                    });
                    await delay(100);  // Introduce a small delay
                };
                reader.readAsArrayBuffer(chunk);
            });
        };

        const promises = [];

        for (let i = 0; i < totalChunks; i++) {
            const start = CHUNK_SIZE * i;
            const end = Math.min(CHUNK_SIZE * (i + 1), file.size);
            const chunk = file.slice(start, end);
            promises.push(uploadChunk(chunk));
        }

        socket.emit('start-upload-font', filePath);

        Promise.all(promises).then(() => {
            socket.emit('end-upload-font', { fileName: file.name, filePath: filePath }, (response) => {
                if (response.status === 'success') {
                    resolve('success');
                } else {
                    reject('Upload failed');
                }
            });
        });
    });

}

const checkTokens = () => {
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    if (!accessToken || !refreshToken) {
        if (window.location.pathname !== '/login' && !['/tos', '/privacy'].includes(window.location.pathname.toLowerCase())) {
            window.location.href = '/login';
        }
    }
};

// Set an interval to check tokens every 10 seconds (can be adjusted based on your needs)
setInterval(checkTokens, 10000);

// Other functions and exports
export default socket
