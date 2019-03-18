
const canvas = document.getElementsByTagName('canvas')[0];
const gl = canvas.getContext('webgl2');

const tick = () => {
    console.log("Tick occurred!")
    requestAnimationFrame(tick);
}
tick();


