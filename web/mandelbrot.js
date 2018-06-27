function initWebGL(canvas) {
  gl = null;

  try {
    // Try to grab the standard context. If it fails, fallback to experimental.
    gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
  }
  catch(e) {}

  // If we don't have a GL context, give up now
  if (!gl) {
    alert("Unable to initialize WebGL. Your browser may not support it.");
    gl = null;
  }

  return gl;
}

window.onload=function(){
    /* Mandelbrot and Julia Set Drawer
        Madelyn Olson - V3.1    -5/18/2014

        Version history
        V1.0    -Basic Functionality for drawing mandelbrot sets
        V1.1    -Allows modifications of window size by zooming
        V2.0    -Basic functionality for drawing julia sets
        V2.1    -Allows setting the Julia parameter from the mandelbrot set
        V2.2    -UI integration
        V3.0    -Seperated out the various functions for increased speed
        V3.1    -Added Animation and dynamic color mapping

        The program generates two images in 400x400 WebGL canvases. The first image is the mandelbrot set, and the second
        is a julia set defined by a complex value. The mandelbrot image can be used to select the complex value. A set
        of points is generated for each image, each point is the center of each pixel.  The individual point is used to
        determine the number of terations needed for that pixel to escape the threshold that gurantees it escapes, at
        r = 2. The color uses the hue system to create a gradual curve of colors, that when animated create a constant
        and stream of color changes.

    */

    //Initialize the canvases and check for WebGL
    var canvasM = document.getElementById("Mandelbrot");
    var canvasJ = document.getElementById("Julia");
    var glM = initWebGL(canvasM);
    var glJ = initWebGL(canvasJ);

    if (!glM || !glJ) {
        alert("no WebGL");
        return;
    }

    //Default values, for initialization and reset conditions
    var mxMin, mxMax, myMin, myMin;
    var myRange, mxRange;

    var jxMin,jxMax,jyMin,jyMax;
    var jyRange,jyRange;

    var mIterations, jIterations;
    var juliaI,juliaR;

    var mColorOffset;
    var jColorOffset;
    function setDefaultValues(){
        mxMin = -2;
        mxMax = 2;
        myMin = -2;
        myMax = 2;
        myRange = myMax-myMin;
        mxRange = mxMax-mxMin;

        jxMin = -2;
        jxMax = 2;
        jyMin = -2;
        jyMax = 2;
        jyRange = jyMax-jyMin;
        jxRange = jxMax-jxMin;

        mIterations = 100;
        jIterations = 100;

        juliaI = 0;
        juliaR =0;

        mColorOffset = 150;
        jColorOffset = 150;
    }


    //After values have been updated in program
    //The values will be moved to the UI
    function setUIValues(){
        document.getElementById("miter").value = mIterations;
        document.getElementById("jiter").value = jIterations;


        document.getElementById("Mmx").value = mxMin;
        document.getElementById("Mxx").value = mxMax;
        document.getElementById("Mmy").value = myMin;
        document.getElementById("Mxy").value = myMax;

        document.getElementById("Jmx").value = jxMin;
        document.getElementById("Jxx").value = jxMax;
        document.getElementById("Jmy").value = jyMin;
        document.getElementById("Jxy").value = jyMax;

        document.getElementById("Ji").value = juliaI;
        document.getElementById("Jr").value = juliaR;
    }

    //Sets variables so they are equal to those in the UI
    function bindValues(){
        mIterations = parseInt(document.getElementById("miter").value);
        jIterations = parseInt(document.getElementById("jiter").value);

        mxMin = parseFloat(document.getElementById("Mmx").value);
        mxMax = parseFloat(document.getElementById("Mxx").value);
        myMin = parseFloat(document.getElementById("Mmy").value);
        myMax = parseFloat(document.getElementById("Mxy").value);
        myRange = myMax-myMin;
        mxRange = mxMax-mxMin;

        jxMin = parseFloat(document.getElementById("Jmx").value);
        jxMax = parseFloat(document.getElementById("Jxx").value);
        jyMin = parseFloat(document.getElementById("Jmy").value);
        jyMax = parseFloat(document.getElementById("Jxy").value);
        jyRange = jyMax-jyMin;
        jxRange = jxMax-jxMin;

        juliaI = parseFloat(document.getElementById("Ji").value);
        juliaR = parseFloat(document.getElementById("Jr").value);
    }

    //Set default values and update UI for initialization
    setDefaultValues();
    setUIValues();

    //Find the buttons on the UI and bind them to variables
    var updateButton = document.getElementById("updateButton");
    var resetButton = document.getElementById("resetButton");
    var AMButton = document.getElementById("AM");
    var AJButton = document.getElementById("AJ");

    //Mouse listener for update button
    updateButton.onclick = function(){
        bindValues();

        generateImages();
    }

    //Mouse listener for reset button
    resetButton.onclick = function(){
        setDefaultValues();
        setUIValues();

        generateImages();
    }

    //Mouse listener for animate Julia set button
    AJButton.onclick = function(){
        jAnimationOn = !jAnimationOn;
    }

    //Mouselistener for animate mandelbrot set button
    AMButton.onclick = function(){
        mAnimationOn = !mAnimationOn;
    }

    //Performs basic functions for computing and drawing fractals
    function generateImages(){
        computeMColorMap();
        generateMandelPoints();
        mandelbrotRenderer.drawGrid(gridVertices, mandelbrotColors);

        computeJColorMap();
        generateJuliaPoints();
        juliaRenderer.drawGrid(gridVertices, juliaColors);
    }

    width = canvasM.width;
    height = canvasM.height;

    // Event handling for the mandelbrot set
    // Allows zooming and selecting a julia point
    class MouseTracker {

        constructor(){
            this.reset();
        }

        setOrigin(mouseEvent, container) {
            this.mouseOrigin[0] = mouseEvent.clientX - container.getBoundingClientRect().left;
            this.mouseOrigin[1] = mouseEvent.clientY - container.getBoundingClientRect().top;
            this.mouseDestination[0] = this.mouseOrigin[0];
            this.mouseDestination[1] = this.mouseOrigin[1];
            this.isMousePressed = true;
        }

        setDestination(mouseEvent, container) {
            this.mouseDestination[0] = mouseEvent.clientX - container.getBoundingClientRect().left;
            this.mouseDestination[1] = mouseEvent.clientY - container.getBoundingClientRect().top;
        }

        reset() {
            this.isMousePressed = false;
            this.mouseOrigin = [0, 0];
            this.mouseDestination = [0, 0];
        }

        isMouseDragged(){
            if(this.isMousePressed == false){
                return false;
            }
            return Math.abs(this.mouseOrigin[0] - this.mouseDestination[0]) > 10 
                && Math.abs(this.mouseOrigin[1] - this.mouseDestination[1]) > 10;
        }

        getOrigin(){
            return [Math.min(this.mouseOrigin[0], this.mouseDestination[0]),
                Math.min(this.mouseOrigin[1], this.mouseDestination[1])]
        }

        getDestination(){
            return [Math.max(this.mouseOrigin[0], this.mouseDestination[0]),
                Math.max(this.mouseOrigin[1], this.mouseDestination[1])]        
        }
    }

    mandelbrotMouseTracker = new MouseTracker()

    canvasM.onmousedown = function(mouseEvent){
        mandelbrotMouseTracker.reset();
        mandelbrotMouseTracker.setOrigin(mouseEvent, canvasM);
    }

    canvasM.onmousemove = function(mouseEvent){
        mandelbrotMouseTracker.setDestination(mouseEvent, canvasM);
    };

    canvasM.onmouseup = function(mouseEvent){
        mandelbrotMouseTracker.setDestination(mouseEvent, canvasM);
        if (!mandelbrotMouseTracker.isMouseDragged()) {
            setJuliaPoint(mandelbrotMouseTracker.getDestination()[0]/width*mxRange + mxMin, 
                myMax - mandelbrotMouseTracker.getDestination()[1]/height*myRange);
            mandelbrotMouseTracker.reset();
            setUIValues();
            return;
        }

        mxMax  = mandelbrotMouseTracker.getDestination()[0]/width * mxRange + mxMin;
        mxMin  = mandelbrotMouseTracker.getOrigin()[0]/width * mxRange + mxMin;

        myMin  = myMax - mandelbrotMouseTracker.getDestination()[1]/height * myRange;
        myMax  = myMax - mandelbrotMouseTracker.getOrigin()[1]/height * myRange;

        myRange = myMax - myMin;
        mxRange = mxMax - mxMin;
        mandelbrotMouseTracker.reset();

        generateMandelPoints();

        setUIValues();
    }

    // Mouse handling for the julia set
    // Allows zooming
    juliaMouseTracker = new MouseTracker()

    canvasJ.onmousedown = function(mouseEvent){
        juliaMouseTracker.reset();
        juliaMouseTracker.setOrigin(mouseEvent, canvasJ);
    }

    canvasJ.onmousemove = function(mouseEvent){
        juliaMouseTracker.setDestination(mouseEvent, canvasJ);
    };

    canvasJ.onmouseup = function(mouseEvent){
        juliaMouseTracker.setDestination(mouseEvent, canvasJ);
        if (!juliaMouseTracker.isMouseDragged()) {
            juliaMouseTracker.reset();
            return;
        }

        jxMax  = juliaMouseTracker.getDestination()[0]/width * jxRange + jxMin;
        jxMin  = juliaMouseTracker.getOrigin()[0]/width * jxRange + jxMin;

        jyMin  = jyMax - juliaMouseTracker.getDestination()[1]/height * jyRange;
        jyMax  = jyMax - juliaMouseTracker.getOrigin()[1]/height * jyRange;

        jyRange = jyMax - jyMin;
        jxRange = jxMax - jxMin;

        juliaMouseTracker.reset();

        generateJuliaPoints();
        juliaRenderer.drawGrid(gridVertices, juliaColors);
        setUIValues();
    }

    //Set the julia point
    //Also redraws the julia frame
    function setJuliaPoint(x,y){
        juliaI =y;;
        juliaR =x;

        generateJuliaPoints();
        juliaRenderer.drawGrid(gridVertices, juliaColors);
    }

    //Generating color maps
    //pushHue sets the give color map to the proper hue gradient
    //iterate is the number of points present, and offset is the offset of the Hue
    //The color map does not have to be regenerated if the image changes
    var i;
    function pushHue(colorMap, iterate,off){
        for(i=0;i<iterate;i++){

            var v =1.0;
            var s = 1.0;

            var h = (i*8+off) %360;

            var ih = parseInt(h/60.0);
            var f = h/60 - ih;
            var p1 = (1-s);
            var p2 = (1 - s*f);
            var p3 = v* (1-s*(1-f));

            switch(ih){
                case 0: colorMap.push(v,p3,p1); break;
                case 1: colorMap.push(p2,v,p1); break;
                case 2: colorMap.push(p1,v,p3); break;
                case 3: colorMap.push(p1,p2,v); break;
                case 4: colorMap.push(p3,p1,v); break;
                case 5: colorMap.push(v,p1,p2); break;
            }
        }
    }

    var colorMap;
    var mOff =0;
    function computeMColorMap(){
        colorMap = [];
        pushHue(colorMap, mIterations,mOff);
    }

    var jColorMap;
    var jOff =0;
    function computeJColorMap(){
        jColorMap = [];
        pushHue(jColorMap, jIterations,jOff);
    }

    //Animation function
    //The animation function runs as fast as possible with a minimum delay
    //If either image should be animated, it will upadate the color map and apply it
    jAnimationOn = false;
    mAnimationOn = false;

    function Animate(){
        if(jAnimationOn){
            jOff = (jOff + 4) % 360;
            computeJColorMap();
            applyJColorMap();
        }
        if(mAnimationOn){
            mOff = (mOff + 4) % 360;
            computeMColorMap();
            applyMColorMap();
        }

        if(mandelbrotMouseTracker.isMouseDragged()){
            mandelbrotRenderer.drawGrid(gridVertices, drawRectangle(width, height,
                mandelbrotMouseTracker.getOrigin(), 
                mandelbrotMouseTracker.getDestination(),
                mandelbrotColors));
        } else {
            mandelbrotRenderer.drawGrid(gridVertices, mandelbrotColors); 
        }

        if(juliaMouseTracker.isMouseDragged()){
            juliaRenderer.drawGrid(gridVertices, drawRectangle(width, height,
                juliaMouseTracker.getOrigin(), 
                juliaMouseTracker.getDestination(),
                juliaColors));
        } else {
            juliaRenderer.drawGrid(gridVertices, juliaColors);
        }
        
        setTimeout(Animate, 20);
    }

    // Computes how many iterations it takes for a path to diverge
    // If the path does not escape in itr iterations, then return -1
    function getIterates(ti,tr,pr,pi,itr){
        var ti2 = ti*ti;
        var tr2 = tr*tr;
        for(i=0;i<itr;i++){
            if((tr2+ti2) > 4){
                return i;
            }
            ti = 2*tr*ti+pi;
            tr = tr2 - ti2 + pr;
            ti2 = ti*ti;
            tr2 = tr*tr;
        }
        return -1;
    }

    //Generate the vertex arrays
    var gridVertices = [];
    for(var x =0; x<width; x++){
        for(var y=0; y<height; y++){
            gridVertices.push(x+0.5, y+0.5);
        }
    }

    //Generates arrays for the points and iterations for the mandelbrot set
    //After generating iterations for the points it applies the color map
    var mandelbrotColors = [];
    var mandelbrotIterates = [];
    function generateMandelPoints(){
        mandelbrotIterates = [];
        for(var x =0;x<width;x++){
            for(var y=0;y<height;y++){
                var xPoint = mxMin+mxRange/width*x;
                var yPoint = myMin+myRange/width*y;
                var result = getIterates(0,0,xPoint,yPoint,mIterations);
                mandelbrotIterates.push(result);
            }
        }
        applyMColorMap();
    }

    //Using the iterations provided with the color map
    //Creates an array of the appropriate colors
    function applyMColorMap(){
        mandelbrotColors = [];
        for(var x =0;x<width;x++){
            for(var y=0;y<height;y++){
                result = mandelbrotIterates[x*height+y];
                if(result >= 0){
                    var m = 3 * result;
                    mandelbrotColors.push(colorMap[m],colorMap[m+1],colorMap[m+2]);
                }else{
                    mandelbrotColors.push(0,0,0)
                }
            }
        }
    }

    //Generates arrays for the points and iterations for the Julia set
    //After generating iterations for the points it applies the color map
    var juliaColors = [];
    var juliaIterates = [];
    function generateJuliaPoints(){
        juliaIterates =[];
        for(var x =0;x<width;x++){
            for(var y=0;y<height;y++){
                var xPoint = jxMin+jxRange/width*x;
                var yPoint = jyMin+jyRange/width*y;

                var result = getIterates(xPoint,yPoint,juliaR,juliaI,jIterations);
                juliaIterates.push(result);
            }
        }
        applyJColorMap();
    }

    //Using the iterations provided with the color map
    //Creates an array of the appropriate colors
    function applyJColorMap(){
        juliaColors=[];
        for(var x =0;x<width;x++){
            for(var y=0;y<height;y++){
                result = juliaIterates[x*height+y];
                if(result >= 0){
                    var m = 3*result;
                    juliaColors.push(jColorMap[m],jColorMap[m+1],jColorMap[m+2]);
                }else{
                    juliaColors.push(0,0,0)
                }
            }
        }
    }

    function drawRectangle(width, height, origin, destination, colors) {
        newColors = colors.slice()
        for(x = height - Math.max(origin[1], destination[1]); x <= height - Math.min(origin[1], destination[1]); x++){
            for(y = Math.min(origin[0], destination[0]); y <= Math.max(origin[0], destination[0]); y++){
                pixelLocation = 3 * (width * y + x);
                newColors[pixelLocation] = newColors[pixelLocation] / 2;
                newColors[pixelLocation + 1] = newColors[pixelLocation + 1] / 2;
                newColors[pixelLocation + 2] = newColors[pixelLocation + 2] / 2;
            }         
        }
        return newColors;
    }

    //WebGL Wrapper for drawing 2D arrays
    class Grid2DRenderer {
        constructor(webGLContext, width, height) {
            this.webGLContext = webGLContext;
            this.program = createProgramFromScripts(webGLContext, ["vshader", "fshader"]);
            this.width = width;
            this.height = height;
        }

        drawGrid(vertices, colors) {
            var numPoints = colors.length / 3;

            var colorBuffer = this.webGLContext.createBuffer();
            this.webGLContext.bindBuffer(this.webGLContext.ARRAY_BUFFER, colorBuffer);
            this.webGLContext.bufferData(this.webGLContext.ARRAY_BUFFER, new Float32Array(colors), this.webGLContext.STATIC_DRAW);
    
            var vertBuffer = this.webGLContext.createBuffer();
            this.webGLContext.bindBuffer(this.webGLContext.ARRAY_BUFFER, vertBuffer);
            this.webGLContext.bufferData(this.webGLContext.ARRAY_BUFFER, new Float32Array(vertices), glM.STATIC_DRAW);
    
            this.webGLContext.useProgram(this.program);
    
            // look up the locations for the inputs to our shaders.
            var u_matLoc = this.webGLContext.getUniformLocation(this.program, "u_matrix");
            var colorLoc = this.webGLContext.getAttribLocation(this.program, "a_color");
            var vertLoc = this.webGLContext.getAttribLocation(this.program, "a_vertex");
    
            // Set the matrix to some that makes 1 unit 1 pixel.
            this.webGLContext.uniformMatrix4fv(u_matLoc, false, [
                2 / this.width, 0, 0, 0,
                0, 2 / this.height, 0, 0,
                0, 0, 1, 0,
                -1, -1, 0, 1
            ]);
    
            this.webGLContext.bindBuffer(this.webGLContext.ARRAY_BUFFER, colorBuffer);
            this.webGLContext.vertexAttribPointer(colorLoc, 3, this.webGLContext.FLOAT, false, 0, 0);
            this.webGLContext.enableVertexAttribArray(colorLoc);
            this.webGLContext.bindBuffer(this.webGLContext.ARRAY_BUFFER, vertBuffer);
            this.webGLContext.vertexAttribPointer(vertLoc, 2, this.webGLContext.FLOAT, false, 0, 0);
            this.webGLContext.enableVertexAttribArray(vertLoc);
    
            this.webGLContext.drawArrays(this.webGLContext.POINTS, 0, numPoints);
        }
    }

    mandelbrotRenderer = new Grid2DRenderer(glM, width, height);
    juliaRenderer = new Grid2DRenderer(glJ, width, height);

    //Start
    generateImages();
    Animate();
}