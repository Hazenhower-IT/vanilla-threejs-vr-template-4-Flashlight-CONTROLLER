// FLASHLIGHT - CUSTOM VR CONTROLLER SETUP 
import * as THREE from 'three';

import { BoxLineGeometry } from 'three/addons/geometries/BoxLineGeometry.js';
import { VRButton } from 'three/examples/jsm/webxr/VRButton';
import { XRControllerModelFactory} from "three/examples/jsm/webxr/XRControllerModelFactory"
import {GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader"

let controller
let torch = new THREE.Group()

const loader = new GLTFLoader()

const raycaster = new THREE.Raycaster()
const workingMatrix = new THREE.Matrix4() 
let workingVector = new THREE.Vector3()


let room, flashlightModel


const scene = new THREE.Scene();
scene.background = new THREE.Color( 0x505050 );

const camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 0.1, 100 );
camera.position.set( 0, 1.6, 3 );
scene.add(camera)


const renderer = new THREE.WebGLRenderer( { antialias: true } );
renderer.setPixelRatio( window.devicePixelRatio );
renderer.setSize( window.innerWidth, window.innerHeight );

document.body.appendChild( renderer.domElement );

renderer.xr.enabled = true

document.body.appendChild( VRButton.createButton( renderer ) );

renderer.setAnimationLoop(loop);

controller = renderer.xr.getController(0)


//aggiungiamo gli event listener per il controller

controller.addEventListener("selectstart", ()=>{
    controller.userData.selectPressed = true
    torch.visible = true
})

controller.addEventListener("selectend", ()=>{
    highlight.visible = false;
    controller.userData.selectPressed = false
    torch.visible = false
})

controller.addEventListener("connected", (e)=>{
    console.log(e.data)
    buildController(e.data, controller)
})

controller.addEventListener("disconnected", ()=>{
    while(controller.children.length > 0){
        controller.remove(controller.children[0])
    }
    controller = null
})
scene.add(controller)




let radius = 0.08

    

room = new THREE.LineSegments(
    new BoxLineGeometry( 6, 6, 6, 10, 10, 10 ).translate( 0, 3, 0 ),
    new THREE.LineBasicMaterial( { color: 0xbcbcbc } )
);
room.geometry.translate( 0, 3, 0)
scene.add( room );

let geometry = new THREE.IcosahedronGeometry(radius, 2)

for(let i=0; i<200; i++){
    let obj = new THREE.Mesh(geometry,
        new THREE.MeshLambertMaterial({
            color: Math.random() * 0xFFFFFF
        }))
    obj.position.x = random(-2 , 2)
    obj.position.y = random(-2 , 2)
    obj.position.z = random(-2 , 2)

    room.add(obj)
}

const highlight = new THREE.Mesh(
    geometry, 
    new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.BackSide })
)

highlight.scale.set(1.5, 1.5, 1.5)
scene.add(highlight)

scene.add( new THREE.HemisphereLight( 0x606060, 0x404040 ) );

const light = new THREE.DirectionalLight( 0xffffff );
light.position.set( 1, 1, 1 ).normalize();
scene.add( light );

   
    
window.addEventListener( 'resize', onWindowResize, false );



function loop() {

    handleController(controller)
            

    renderer.render( scene, camera );
}


function buildController(data, controller){

    let geometry, material

    switch(data.targetRayMode){
        case "tracked-pointer":

            flashlightModel = "/assets/flashlight.glb"
            loader.load(flashlightModel , (gltf)=>{
                const flashlight = gltf.scene.children[0]
                const scala = 0.03
                flashlight.scale.set(scala,scala,scala)
                flashlight.rotation.y += Math.PI/2
                controller.add(flashlight)

                const spotlight = new THREE.SpotLight(0xffffff, 5, 12, Math.PI/15, 0.3)
                spotlight.position.set(0,0,0)
                spotlight.target.position.set(0, 0, -1)
                torch.add(spotlight.target)
                torch.add(spotlight)

                controller.add(torch)
                torch.visible = false
                },

                null,

                (error)=>{
                    console.error("An error occured, non me chiede andò però: ", error)
                }
            )
            break;
        
        case "gaze":
            geometry = new THREE.RingGeometry(0.02, 0.04, 32).translate(0, 0, -1)
            material = new THREE.MeshBasicMaterial({opacity: 0.5, trasparent: true})
            controller.add(new THREE.Mesh(geometry, material))
    }
}

function handleController(controller){

  if(controller.userData.selectPressed){  
    
    workingMatrix.identity().extractRotation(controller.matrixWorld)

    raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld)

    raycaster.ray.direction.set(0, 0, -1).applyMatrix4(workingMatrix)


    let intersects = raycaster.intersectObjects(room.children)

    if(intersects.length>0){
      if(intersects[0].object !== highlight){
        intersects[0].object.add(highlight)
        highlight.visible = true
      }  
      
    }
    else{
      highlight.visible = false
    }
  }
}


function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

}

function random( min, max ){
    return Math.random() * (max-min) + min;
}

//Render (Animation Loop)




