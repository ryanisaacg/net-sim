import Address from './address'
import NetworkNode from './network-node'
import Point from './point'
import Renderer from './renderer';

const renderer = new Renderer();

const rootNode = new NetworkNode(new Address(0), new Point(0, 0));
new NetworkNode(new Address(0, 1), new Point(5, 0), rootNode);
new NetworkNode(new Address(0, 2), new Point(0, 5), rootNode);
new NetworkNode(new Address(0, 3), new Point(0, -5), rootNode);
new NetworkNode(new Address(0, 4), new Point(-5, 0), rootNode);

renderer.updateSimulation(rootNode);

const render = function () {
    requestAnimationFrame( render );
    renderer.updateSimulation(rootNode);
    renderer.render();
};

render();

