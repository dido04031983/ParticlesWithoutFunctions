"use strict";

const canvas=document.querySelector("canvas");
const ctx=canvas.getContext("2d");
canvas.width=this.innerWidth-4;
canvas.height=this.innerHeight-4;
const WidthInverse=1/canvas.width;

const canvasCon=function(position,param){
  const result={
    x:0.5*canvas.width*(position.x+1),
    y:canvas.height-0.5*(canvas.width*position.y+canvas.height)
  };
  result[param[0]]=0.5*param[1]*canvas.width;
  return result;
};

const DrawDisk=function(position,radious,color){
  const canvasPos=canvasCon(position,["radius",radious]);
  ctx.fillStyle=typeof(color)=="function"?color(canvasPos):color;
  ctx.beginPath();
  ctx.arc(canvasPos.x,canvasPos.y,canvasPos.radius,0,2*Math.PI);
  ctx.fill();
  ctx.closePath();
};

function DrawArrow(position,vector,width,color){
  const VectorLen=0.2*Math.pow(vector.x*vector.x+vector.y*vector.y,-0.25);
  const canvasPos=canvasCon(position,["width",width]);
  const canvasVec={x:VectorLen*canvas.width*vector.x,y:-VectorLen*canvas.width*vector.y};
  const canvasDisp={x:canvasPos.x+canvasVec.x,y:canvasPos.y+canvasVec.y};
  ctx.strokeStyle=typeof(color)=="function"?color(canvasPos,canvasDisp):color;
  ctx.lineWidth=canvasPos.width;
  ctx.lineCap="round";
  ctx.beginPath();
  ctx.moveTo(canvasPos.x,canvasPos.y);
  ctx.lineTo(canvasDisp.x,canvasDisp.y);
  ctx.stroke();
  ctx.moveTo(canvasDisp.x,canvasDisp.y);
  ctx.lineTo(canvasDisp.x-0.0866*canvasVec.x-0.05*canvasVec.y,canvasDisp.y+0.05*canvasVec.x-0.0866*canvasVec.y);
  ctx.stroke();
  ctx.moveTo(canvasDisp.x,canvasDisp.y);
  ctx.lineTo(canvasDisp.x-0.0866*canvasVec.x+0.05*canvasVec.y,canvasDisp.y-0.05*canvasVec.x-0.0866*canvasVec.y);
  ctx.stroke();
  ctx.closePath();
};

const TouchCoords=function(touch){
  return{x:2*WidthInverse*touch.clientX-1,y:WidthInverse*(2*(canvas.height-touch.clientY)-canvas.height)};
};

class Particle{
  constructor(position,velocity,radious,mass){
    this.position=position;
    this.velocity=velocity;
    this.radious=radious;
    this.mass=mass;
    this.nrgloss=0;
    this.color=function(position){
      const gradient=ctx.createRadialGradient(position.x,position.y,0,position.x,position.y,position.radius);
      gradient.addColorStop(0,"white");
      gradient.addColorStop(0.2,"red");
      gradient.addColorStop(1,"transparent");
      return gradient;
    };
    this.time=window.performance.now();
  }
  UpdateVariables(force,time){
    const dtime=0.001*(time-this.time);
    const acceleration={
      x:force.x/this.mass,
      y:force.y/this.mass
    };
    const friction=1;
    this.time=time;
    this.velocity={
      x:this.velocity.x+acceleration.x*dtime,
      y:this.velocity.y+acceleration.y*dtime
    };
    this.position={
      x:this.position.x+this.velocity.x*dtime+0.5*acceleration.x*dtime*dtime,
      y:this.position.y+this.velocity.y*dtime+0.5*acceleration.y*dtime*dtime
    };
    if(this.position.x<-1 && this.velocity.x<0){
      this.position.x=-1;
      this.nrgloss+=0.5*this.mass*this.velocity.x*this.velocity.x;
      this.velocity.x*=-friction;
      this.nrgloss-=0.5*this.mass*this.velocity.x*this.velocity.x;
    }
    if(this.position.x>1 && this.velocity.x>0){
      this.position.x=1;
      this.nrgloss+=0.5*this.mass*this.velocity.x*this.velocity.x;
      this.velocity.x*=-friction;
      this.nrgloss-=0.5*this.mass*this.velocity.x*this.velocity.x;
    }
    if(this.position.y<-WidthInverse*canvas.height && this.velocity.y<0){
      this.position.y=-WidthInverse*canvas.height;
      this.nrgloss+=0.5*this.mass*this.velocity.y*this.velocity.y;
      this.velocity.y*=-friction;
      this.nrgloss-=0.5*this.mass*this.velocity.y*this.velocity.y;
    }
    if(this.position.y>WidthInverse*canvas.height && this.velocity.y>0){
      this.position.y=WidthInverse*canvas.height;
      this.nrgloss+=0.5*this.mass*this.velocity.y*this.velocity.y;
      this.velocity.y*=-friction;
      this.nrgloss-=0.5*this.mass*this.velocity.y*this.velocity.y;
    }
    this.Draw();
  }
  Draw(){
    const color=function(start,end){
      const gradient=ctx.createLinearGradient(start.x,start.y,end.x,end.y);
      gradient.addColorStop(0,"red");
      gradient.addColorStop(0.5,"green");
      gradient.addColorStop(1,"blue");
      return gradient;
    }
    DrawArrow(this.position,this.velocity,0.2*this.radious,color);
    DrawDisk(this.position,this.radious,this.color);
  }
}

const particles=[];
for(let i=0;i<10;i++){
  particles.push(new Particle({x:2*Math.random()-1,y:WidthInverse*canvas.height*(2*Math.random()-1)},{x:2*Math.random()-1,y:2*Math.random()-1},0.05+0.01*Math.random(),1+9*Math.random()));
}

let IterationActive=true;
const IteratorModule=function(time){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  particles.forEach(function(particle){
    const force={x:0,y:0};//{x:pointer.x-particle.position.x,y:pointer.y-particle.position.y};
    particle.UpdateVariables(force,time);
  });
};

const pointer={x:0,y:0};
canvas.addEventListener("touchstart",function(Event){
  if(Event.touches.length==1){
    const Coords=TouchCoords(Event.touches[0]);
    pointer.x=Coords.x;
    pointer.y=Coords.y;
  }
});
canvas.addEventListener("touchmove",function(Event){
  const Coords=TouchCoords(Event.touches[0]);
  pointer.x=Coords.x;
  pointer.y=Coords.y;
});

canvas.addEventListener("dblclick",function(Event){
  if(IterationActive){
    IterationActive=false;
  }else{
    particles.forEach(function(particle){
      particle.time=Event.timeStamp;
    });
    IterationActive=true;
  }
});
