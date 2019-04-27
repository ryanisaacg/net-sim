import { Scene, PerspectiveCamera, WebGLRenderer, BoxGeometry, MeshBasicMaterial, Mesh } from 'three';
import NetworkNode from './network-node';
import Address from './address';
import Point from './point';

// ------------------------------------------------
// BASIC SETUP
// ------------------------------------------------

// Create an empty scene
var scene = new Scene();

// Create a basic perspective camera
var camera = new PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 1000 );
camera.position.z = 4;

// Create a renderer with Antialiasing
var renderer = new WebGLRenderer({antialias:true});

// Configure renderer clear color
renderer.setClearColor("#000000");

// Configure renderer size
renderer.setSize( window.innerWidth, window.innerHeight );

// Append Renderer to DOM
document.body.appendChild( renderer.domElement );

// ------------------------------------------------
// FUN STARTS HERE
// ------------------------------------------------

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

// Create a Cube Mesh with basic material
var geometry = new BoxGeometry( 1, 1, 1 );
var material = new MeshBasicMaterial( { color: "#000000" } );
var cube = new Mesh( geometry, material );

// Add cube to Scene
scene.add( cube );

// Render Loop
var render = function () {
  requestAnimationFrame( render );

  cube.rotation.x += 0.01;
  cube.rotation.y += 0.01;

  // Render the scene
  renderer.render(scene, camera);
};

render();
