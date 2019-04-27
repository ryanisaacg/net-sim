import NetworkNode from './network-node';
import Address from './address';
import Renderer from './renderer';
import Point from './point';

const renderer = new Renderer();

// Whiteboard network
let network: NetworkNode[] = [];
let region = new NetworkNode(new Point(0, 0), new Address(1));
let localA = new NetworkNode(new Point(0, 100), region);
let localB = new NetworkNode(new Point(-50, -100), region);
let localC = new NetworkNode(new Point(50, 100), region);
localA.addPeer(localB);
localA.addPeer(localC);
localB.addPeer(localC);
let a1 = new NetworkNode(new Point(-50, 200), localA);
let a2 = new NetworkNode(new Point(0, 250), localA);
let a3 = new NetworkNode(new Point(50, 200), localA);
a2.addPeer(a1);
a2.addPeer(a3);
let b1 = new NetworkNode(new Point(-150, -100), localB);
let b2 = new NetworkNode(new Point(-100, -150), localB);
let c1 = new NetworkNode(new Point(150, -100), localC);
let c2 = new NetworkNode(new Point(100, -150), localC);
c1.addPeer(c2);
Array.prototype.push.apply(network, [region, localA, localB, localC, a1, a2, a3, b1, b2, c1, c2]); // Add nodes made so far to the network
network.push(new NetworkNode(new Point(-150, 200), a1));
network.push(new NetworkNode(new Point(-100, 250), a1));
network.push(new NetworkNode(new Point(-50, 300), a2));
network.push(new NetworkNode(new Point(50, 300), a2));
network.push(new NetworkNode(new Point(100, 250), a3));
network.push(new NetworkNode(new Point(-200, -50), b1));
network.push(new NetworkNode(new Point(-250, -80), b1));
network.push(new NetworkNode(new Point(-250, -120), b1));
network.push(new NetworkNode(new Point(-200, -150), b1));
network.push(new NetworkNode(new Point(-150, -200), b2));
network.push(new NetworkNode(new Point(-50, -200), b2));
network.push(new NetworkNode(new Point(200, -50), c1));
network.push(new NetworkNode(new Point(250, -100), c1));
network.push(new NetworkNode(new Point(200, -150), c1));
network.push(new NetworkNode(new Point(150, -200), c2));

renderer.updateSimulation(region);

const render = function () {
    requestAnimationFrame( render );
    renderer.render();
};

render();
