import { Scene } from 'three'
import Address from './address'

const test = new Address(0);
const scene = new Scene();
const canvas = document.getElementsByTagName('canvas')[0];
const gl = canvas.getContext('webgl2');

const tick = () => {
    console.log("Tick occurred!")
    console.log(scene);
    console.log(test);
    console.log(gl);
    requestAnimationFrame(tick);
}
tick();


