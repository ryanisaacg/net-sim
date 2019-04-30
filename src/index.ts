import NetworkNode from './network-node';
//import NetworkPacket from './network-packet';
import Address from './address';
import NetworkPacket from './network-packet'
import Renderer from './renderer';
import Point from './point';
import TcpConnection from './tcp-connection'

const renderer = new Renderer();

// Whiteboard network
let network: NetworkNode[] = [];
let region = new NetworkNode(new Point(0, 0), new Address(1));
let localA = new NetworkNode(new Point(0, 100), region);
let localB = new NetworkNode(new Point(-50, -100), region);
let localC = new NetworkNode(new Point(50, -100), region);
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
let a11 = new NetworkNode(new Point(-150, 200), a1);
network.push(a11);
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
let c11 = new NetworkNode(new Point(200, -50), c1);
network.push(c11);
network.push(new NetworkNode(new Point(250, -100), c1));
network.push(new NetworkNode(new Point(200, -150), c1));
network.push(new NetworkNode(new Point(150, -200), c2));

let tcpConnections: TcpConnection[][] = []

renderer.updateSimulation(region);

const render = function () {
    requestAnimationFrame( render );
    tcpConnections.forEach(pair => pair.forEach(tcp => renderer.addTcpPipe(tcp)));
    renderer.render();
};

render();

const updateNode = function (node: NetworkNode) {
    node.tick();
    if(node.parent) {
        node.parent.tick();
    }
    node.peers.forEach(peer => peer.tick());
    node.children.forEach(child => {
        child.tick();
        updateNode(child.end);
    })
};

let hosts = network.filter((node) => node.addr.node);
// [
//     // [0, 7],
//      [1, 4],
//     // [3, 12],
//     // [3, 5],
// ].forEach(([hostIndex, targetIndex]) => {
//     let host = hosts[hostIndex]
//     let target = hosts[targetIndex]
//     const toTarget = new TcpConnection(host, target);
//     const toHost = new TcpConnection(target, host);
//     toTarget.write("Hello.");
//     tcpConnections.push([toTarget, toHost])
// })

let paused = false;
const pauseButton = document.getElementById('pause')!;

pauseButton.onclick = () => {
    if(paused) {
        pauseButton.innerHTML = 'Pause Simulation';
        paused = false;
    } else {
        pauseButton.innerHTML = 'Play Simulation';
        paused = true;
    }
}

setInterval(update, 10);
function update () {
    if(paused) {
        renderer.updateSimulation(region);
        return;
    }

    tcpConnections.forEach(([a, b]) => {
        a.tick();
        b.tick();
    })
    //const completed = tcpConnections.filter(([a, b]) => a.completed() || b.completed())
    tcpConnections = tcpConnections.filter(([a, b]) => !(a.completed() && b.completed()))

    updateNode(region);

    renderer.updateSimulation(region);

    hosts.forEach((host) => {
        if(Math.random() < 0.001) {
            let target = hosts[Math.floor(Math.random() * hosts.length)];
            host.enqueuePacket(new NetworkPacket(host.addr, target.addr, "!Henwo"));
            host.enqueuePacket(new NetworkPacket(host.addr, target.addr, "!Wowwd"));
        }

        if(Math.random() < 0.00005) {
            let target = hosts[Math.floor(Math.random() * hosts.length)];
            if(host != target) {
                const toTarget = new TcpConnection(host, target);
                const toHost = new TcpConnection(target, host);
                toTarget.write("Hello.");
                tcpConnections.push([toTarget, toHost])
            }
        }
    });
}
