$(document).ready(function() {
    $.ajax({
        url: '/video',
        method: 'GET',
        success: function(response) {
            $('#video').attr('src', response.videoPath);
        },
        error: function(error) {
            console.log('Error loading video:', error);
        }
    });

    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const playBtn = document.getElementById('play');
    const pauseBtn = document.getElementById('pause');
    let boxes = [];
    let interval;
    let busy = false;

    const workerScript = `
        importScripts('https://cdn.jsdelivr.net/npm/onnxruntime-web/dist/ort.min.js');
        let model = null;

        onmessage = async(event) => {
            const input = event.data;
            const output = await run_model(input);
            postMessage(output);
        }

        async function run_model(input) {
            if (!model) {
                model = await ort.InferenceSession.create('/data/models/yolov8n.onnx');
            }
            input = new ort.Tensor(Float32Array.from(input), [1, 3, 640, 640]);
            const outputs = await model.run({ images: input });
            return outputs['output0'].data;
        }
    `;

    const workerBlob = new Blob([workerScript], { type: 'application/javascript' });
    const worker = new Worker(URL.createObjectURL(workerBlob));

    playBtn.addEventListener('click', () => {
        video.play();
    });

    pauseBtn.addEventListener('click', () => {
        video.pause();
    });

    video.addEventListener('play', () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext('2d');

        interval = setInterval(() => {
            context.drawImage(video, 0, 0);
            draw_boxes(canvas, boxes);
            const input = prepare_input(canvas);
            if (!busy) {
                worker.postMessage(input);
                busy = true;
            }
        }, 30);
    });

    video.addEventListener('pause', () => {
        clearInterval(interval);
    });

    worker.onmessage = (event) => {
        const output = event.data;
        boxes = process_output(output, canvas.width, canvas.height);
        save_frame_with_boxes(canvas, boxes);  // Save frame with boxes
        busy = false;
    };

    function prepare_input(img) {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = 640;
        tempCanvas.height = 640;
        const context = tempCanvas.getContext('2d');
        context.drawImage(img, 0, 0, 640, 640);
        const data = context.getImageData(0, 0, 640, 640).data;
        const red = [], green = [], blue = [];
        for (let i = 0; i < data.length; i += 4) {
            red.push(data[i] / 255);
            green.push(data[i + 1] / 255);
            blue.push(data[i + 2] / 255);
        }
        return [...red, ...green, ...blue];
    }

    function process_output(output, img_width, img_height) {
        let boxes = [];
        for (let i = 0; i < 8400; i++) {
            const [class_id, prob] = [...Array(yolo_classes.length).keys()]
                .map(col => [col, output[8400 * (col + 4) + i]])
                .reduce((accum, item) => item[1] > accum[1] ? item : accum, [0, 0]);
            if (prob < 0.5) continue;
            const label = yolo_classes[class_id];
            const xc = output[i];
            const yc = output[8400 + i];
            const w = output[2 * 8400 + i];
            const h = output[3 * 8400 + i];
            const x1 = (xc - w / 2) / 640 * img_width;
            const y1 = (yc - h / 2) / 640 * img_height;
            const x2 = (xc + w / 2) / 640 * img_width;
            const y2 = (yc + h / 2) / 640 * img_height;
            boxes.push([x1, y1, x2, y2, label, prob]);
        }
        return boxes.sort((a, b) => b[5] - a[5]).filter((box, i, arr) => arr.findIndex(b => iou(box, b) > 0.7) === i);
    }

    function iou(box1, box2) {
        return intersection(box1, box2) / union(box1, box2);
    }

    function union(box1, box2) {
        const [x1, y1, x2, y2] = box1;
        const [bx1, by1, bx2, by2] = box2;
        return (x2 - x1) * (y2 - y1) + (bx2 - bx1) * (by2 - by1) - intersection(box1, box2);
    }

    function intersection(box1, box2) {
        const [x1, y1, x2, y2] = box1;
        const [bx1, by1, bx2, by2] = box2;
        return Math.max(0, Math.min(x2, bx2) - Math.max(x1, bx1)) * Math.max(0, Math.min(y2, by2) - Math.max(y1, by1));
    }

    function draw_boxes(canvas, boxes) {
        const ctx = canvas.getContext('2d');
        ctx.strokeStyle = "#00FF00";
        ctx.lineWidth = 3;
        ctx.font = "18px serif";
        boxes.forEach(([x1, y1, x2, y2, label]) => {
            ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
            ctx.fillStyle = "#00ff00";
            const width = ctx.measureText(label).width;
            ctx.fillRect(x1, y1, width + 10, 25);
            ctx.fillStyle = "#000000";
            ctx.fillText(label, x1, y1 + 18);
        });
    }

    function save_frame_with_boxes(canvas, boxes) {
        const ctx = canvas.getContext('2d');
        const dataUrl = canvas.toDataURL('image/png');
        $.ajax({
            type: "POST",
            url: "/save-frame",
            data: {
                image: dataUrl,
                boxes: JSON.stringify(boxes)
            },
            success: function(response) {
                console.log('Frame saved:', response);
            },
            error: function(error) {
                console.error('Error saving frame:', error);
            }
        });
    }

    const yolo_classes = [
        'person', 'bicycle', 'car', 'motorcycle', 'airplane', 'bus', 'train', 'truck', 'boat',
        'traffic light', 'fire hydrant', 'stop sign', 'parking meter', 'bench', 'bird', 'cat', 'dog', 'horse',
        'sheep', 'cow', 'elephant', 'bear', 'zebra', 'giraffe', 'backpack', 'umbrella', 'handbag', 'tie', 'suitcase',
        'frisbee', 'skis', 'snowboard', 'sports ball', 'kite', 'baseball bat', 'baseball glove', 'skateboard',
        'surfboard', 'tennis racket', 'bottle', 'wine glass', 'cup', 'fork', 'knife', 'spoon', 'bowl', 'banana', 'apple',
        'sandwich', 'orange', 'broccoli', 'carrot', 'hot dog', 'pizza', 'donut', 'cake', 'chair', 'couch', 'potted plant',
        'bed', 'dining table', 'toilet', 'tv', 'laptop', 'mouse', 'remote', 'keyboard', 'cell phone', 'microwave', 'oven',
        'toaster', 'sink', 'refrigerator', 'book', 'clock', 'vase', 'scissors', 'teddy bear', 'hair drier', 'toothbrush'
    ];
});
