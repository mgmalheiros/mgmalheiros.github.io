/* 
 * Saturated reaction-diffusion (Turing equations)
 *
 * Based on code from pmneila <p.mneila at upm.es>
 */

(function(){

// Canvas.
var canvas;
var canvasQ;
var canvasWidth;
var canvasHeight;

var mMouseX, mMouseY;
var mMouseDown = false;

var mRenderer;
var mScene;
var mCamera;
var mUniforms;
var mColors;
var mColorsNeedUpdate = true;

var mTexture1, mTexture2;
var mGSMaterial, mScreenMaterial;
var mScreenQuad;

var mToggled = false;

var mMinusOnes = new THREE.Vector2(-1, -1);

// Some presets.
var presets = [
    // Default
    "0,0.6,0.1,20,20,0,#0000FF,0.25,#00FFFF,0.5,#00FF00,0.75,#FFFF00,1,#FF0000",
    
    // Giraffe (Giraffa reticulata)
    "0,0.4,0.1,6.3,6.3,0,#FFFFFF,0.5,#FFFFFF,0.6,#5B3504,1,#5B3504,1,#5B3504",
    
    // Nudibranch (Hypselodoris iacula)
    "0,0.4,0.05,5.3,20,0,#FFFFFF,0.3,#FFFFFF,0.4,#EAAA7A,1,#EAAA7A,1,#EAAA7A",

    // Moray #1 (Gymnothorax favagineus)
    "0,0.42,0.06,5.6,20,0,#F3F5F7,0.3,#F3F5F7,0.45,#3E2F2F,1,#3E2F2F,1,#3E2F2F",
    
    // Frog #1 (Dendrobates leucomelas)
    "0,0.35,0.05,5.4,8.4,0,#FFFF00,0.4,#FFFF00,0.6,#000000,1,#000000,1,#000000",

    // Frog #2 [stripes] (Ranitomeya amazonica)
    "0,0.60,0.04,6.3,20,0,#FFBF00,0.1,#FFBF00,0.2,#00FFFF,0.4,#202020,1,#202020",
    // Frog #2 [spots] (Ranitomeya amazonica)
    "0,0.12,0.03,6.3,20,0,#FFBF00,0.1,#FFBF00,0.2,#00FFFF,0.4,#202020,1,#202020",
    
    // Moray #2 [dark] (Muraena melanotis)
    "0,0.2,0.04,6.5,6.5,0,#30292D,0.3,#30292D,0.4,#E8E336,0.45,#FFFFFF,1,#FFFFFF",
    // Moray #2 [light] (Muraena melanotis)
    "0,0.8,0.02,6.5,6.5,0,#30292D,0.3,#30292D,0.4,#E8E336,0.45,#FFFFFF,1,#FFFFFF",
];

// Configuration.
var chem = 0.0;
var diff_u = 0.6;
var diff_v = 0.1;
var limit_u = 20;
var limit_v = 20;

init = function()
{
    init_controls();
    
    canvasQ = $('#myCanvas');
    canvas = canvasQ.get(0);
    
    canvas.onmousedown = onMouseDown;
    canvas.onmouseup = onMouseUp;
    canvas.onmousemove = onMouseMove;
    
    mRenderer = new THREE.WebGLRenderer({canvas: canvas, preserveDrawingBuffer: true});

    mScene = new THREE.Scene();
    mCamera = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, -10000, 10000);
    mCamera.position.z = 100;
    mScene.add(mCamera);
    
    mUniforms = {
        screenWidth:  {type: "f", value: undefined},
        screenHeight: {type: "f", value: undefined},
        tSource: {type: "t",  value: undefined},
        seed:    {type: "f",  value: 0.0},
        chem:    {type: "f",  value: chem},
        diff_u:  {type: "f",  value: diff_u},
        diff_v:  {type: "f",  value: diff_v},
        limit_u: {type: "f",  value: limit_u},
        limit_v: {type: "f",  value: limit_v},
        aniso_u: {type: "f",  value: 0.0},
        aniso_v: {type: "f",  value: 0.0},
        split:   {type: "f",  value: 0.0},
        color1:  {type: "v4", value: new THREE.Vector4(0, 0, 1, 0.00)},
        color2:  {type: "v4", value: new THREE.Vector4(0, 1, 1, 0.25)},
        color3:  {type: "v4", value: new THREE.Vector4(0, 1, 0, 0.50)},
        color4:  {type: "v4", value: new THREE.Vector4(1, 1, 0, 0.75)},
        color5:  {type: "v4", value: new THREE.Vector4(1, 0, 0, 1.00)},
        brush:   {type: "v2", value: new THREE.Vector2(-10, -10)},
    };
    mColors = [mUniforms.color1, mUniforms.color2, mUniforms.color3, mUniforms.color4, mUniforms.color5];
    $("#gradient").gradient("setUpdateCallback", onUpdatedColor);
    
    mGSMaterial = new THREE.ShaderMaterial({
            uniforms: mUniforms,
            vertexShader: document.getElementById('standardVertexShader').textContent,
            fragmentShader: document.getElementById('gsFragmentShader').textContent,
        });
    mScreenMaterial = new THREE.ShaderMaterial({
                uniforms: mUniforms,
                vertexShader: document.getElementById('standardVertexShader').textContent,
                fragmentShader: document.getElementById('screenFragmentShader').textContent,
            });
    
    var plane = new THREE.PlaneGeometry(1.0, 1.0);
    mScreenQuad = new THREE.Mesh(plane, mScreenMaterial);
    mScene.add(mScreenQuad);
    
    mColorsNeedUpdate = true;
    
    resize(canvas.clientWidth, canvas.clientHeight);
    
    render(0);
    //mUniforms.brush.value = new THREE.Vector2(0.5, 0.5); // paints a brush at screen center
    requestAnimationFrame(render);
}

var resize = function(width, height)
{
    // Set the new shape of canvas.
    canvasQ.width(width);
    canvasQ.height(height);
    
    // Get the real size of canvas.
    canvasWidth = canvasQ.width();
    canvasHeight = canvasQ.height();
    
    mRenderer.setSize(canvasWidth, canvasHeight);
    
    // TODO: Possible memory leak?
    mTexture1 = new THREE.WebGLRenderTarget(canvasWidth/4, canvasHeight/4, //canvasWidth/2, canvasHeight/2,
                        {minFilter: THREE.NearestFilter, //THREE.LinearFilter,
                         magFilter: THREE.NearestFilter,
                         format: THREE.RGBAFormat,
                         type: THREE.FloatType});
    mTexture2 = new THREE.WebGLRenderTarget(canvasWidth/4, canvasHeight/4, //canvasWidth/2, canvasHeight/2,
                        {minFilter: THREE.NearestFilter,
                         magFilter: THREE.NearestFilter,
                         format: THREE.RGBAFormat,
                         type: THREE.FloatType});
    mTexture1.wrapS = THREE.RepeatWrapping;
    mTexture1.wrapT = THREE.RepeatWrapping;
    mTexture2.wrapS = THREE.RepeatWrapping;
    mTexture2.wrapT = THREE.RepeatWrapping;
    
    mUniforms.screenWidth.value  = canvasWidth/4;  // canvasWidth/2;
    mUniforms.screenHeight.value = canvasHeight/4; //canvasHeight/2;
}

var render = function(time)
{
    mScreenQuad.material = mGSMaterial;
    mUniforms.chem.value = chem;
    mUniforms.diff_u.value = diff_u;
    mUniforms.diff_v.value = diff_v;
    mUniforms.limit_u.value = limit_u;
    mUniforms.limit_v.value = limit_v;
        
    for (var i=0; i<8; ++i)
    {
        if (!mToggled)
        {
            mUniforms.tSource.value = mTexture1;
            mRenderer.render(mScene, mCamera, mTexture2, true);
            mUniforms.tSource.value = mTexture2;
        }
        else
        {
            mUniforms.tSource.value = mTexture2;
            mRenderer.render(mScene, mCamera, mTexture1, true);
            mUniforms.tSource.value = mTexture1;
        }
        
        mToggled = !mToggled;
        mUniforms.brush.value = mMinusOnes; // disable brush
    }
    
    if (mColorsNeedUpdate)
        updateUniformsColors();
    
    mScreenQuad.material = mScreenMaterial;
    mRenderer.render(mScene, mCamera);
    
    requestAnimationFrame(render);
}

loadPreset = function(idx)
{
    $("#share").val(presets[idx]);
    parseShareString();
}

var updateUniformsColors = function()
{
    var values = $("#gradient").gradient("getValuesRGBS");
    for (var i=0; i<values.length; i++)
    {
        var v = values[i];
        mColors[i].value = new THREE.Vector4(v[0], v[1], v[2], v[3]);
    }
    
    mColorsNeedUpdate = false;
}

var onUpdatedColor = function()
{
    mColorsNeedUpdate = true;
    updateShareString();
}

var onMouseMove = function(e)
{
    var ev = e ? e : window.event;
    
    mMouseX = ev.pageX - canvasQ.offset().left; // these offsets work with
    mMouseY = ev.pageY - canvasQ.offset().top; //  scrolled documents too
    
    if (mMouseDown) {
        mUniforms.brush.value = new THREE.Vector2(mMouseX/canvasWidth, 1-mMouseY/canvasHeight);
    }
}

var onMouseDown = function(e)
{
    var ev = e ? e : window.event;
    mMouseDown = true;
    
    mUniforms.brush.value = new THREE.Vector2(mMouseX/canvasWidth, 1-mMouseY/canvasHeight);
}

var onMouseUp = function(e)
{
    mMouseDown = false;
}

clean = function()
{
    mUniforms.brush.value = new THREE.Vector2(-10, -10);
    mUniforms.seed.value  = Math.random();
}

select_u = function()
{
    chem = 0.0;
    $("#btn_select_u").button({icons : {primary : "ui-icon-check"}});
    $("#btn_select_v").button({icons : {primary : ""}});
    updateShareString();
}

select_v = function()
{
    chem = 1.0;
    $("#btn_select_u").button({icons : {primary : ""}});
    $("#btn_select_v").button({icons : {primary : "ui-icon-check"}});
    updateShareString();
}

aniso_u = function()
{
    if (mUniforms.aniso_u.value == 0.0) {
        mUniforms.aniso_u.value = 1.0;
        $("#btn_aniso_u").button({icons : {primary : "ui-icon-arrowthick-2-n-s"}});
    }
    else {
        mUniforms.aniso_u.value = 0.0;
        $("#btn_aniso_u").button({icons : {primary : "ui-icon-closethick"}});
    }
}

aniso_v = function()
{
    if (mUniforms.aniso_v.value == 0.0) {
        mUniforms.aniso_v.value = 1.0;
        $("#btn_aniso_v").button({icons : {primary : "ui-icon-arrowthick-2-n-s"}});
    }
    else {
        mUniforms.aniso_v.value = 0.0;
        $("#btn_aniso_v").button({icons : {primary : "ui-icon-closethick"}});
    }
}

toggle_split = function()
{
    if (mUniforms.split.value == 0.0) {
        mUniforms.split.value = 1.0;
        $("#btn_split").button({icons : {primary : "ui-icon-carat-2-e-w"}});
    }
    else {
        mUniforms.split.value = 0.0;
        $("#btn_split").button({icons : {primary : "ui-icon-closethick"}});
    }
}

snapshot = function()
{
    var dataURL = canvas.toDataURL("image/png");
    window.open(dataURL, "name-"+Math.random());
}

var worldToForm = function()
{
    if (chem == 0.0) {
        select_u();
    }
    else {
        select_v();
    }
    $("#sld_diff_u").slider("value", diff_u);
    $("#sld_diff_v").slider("value", diff_v);
    $("#sld_limit_u").slider("value", limit_u);
    $("#sld_limit_v").slider("value", limit_v);
}

var init_controls = function()
{
    $("#btn_clear").button({
        icons : {primary : "ui-icon-refresh"},
        text : false
    });
    $("#btn_select_u").button({
        icons : {primary : "ui-icon-check"},
        label: "U"
    });
    $("#btn_select_v").button({
        label: "V"
    });
    $("#btn_snapshot").button({
        icons : {primary : "ui-icon-image"},
        text : false
    });

    $("#sld_diff_u").slider({
        value: diff_u, min: 0.04, max:0.80, step:0.01,
        change: function(event, ui) {$("#diff_u").html(ui.value); diff_u = ui.value; updateShareString();},
        slide:  function(event, ui) {$("#diff_u").html(ui.value); diff_u = ui.value; updateShareString();}
    });
    $("#sld_diff_u").slider("value", diff_u);
    
    $("#sld_diff_v").slider({
        value: diff_v, min: 0.01, max:0.20, step:0.01,
        change: function(event, ui) {$("#diff_v").html(ui.value); diff_v = ui.value; updateShareString();},
        slide:  function(event, ui) {$("#diff_v").html(ui.value); diff_v = ui.value; updateShareString();}
    });
    $("#sld_diff_v").slider("value", diff_v);

    $("#sld_limit_u").slider({
        value: limit_u, min: 2.0, max: 20.0, step:0.1,
        change: function(event, ui) {$("#limit_u").html(ui.value); limit_u = ui.value; updateShareString();},
        slide:  function(event, ui) {$("#limit_u").html(ui.value); limit_u = ui.value; updateShareString();}
    });
    $("#sld_limit_u").slider("value", limit_u);
    
    $("#sld_limit_v").slider({
        value: limit_v, min: 2.0, max: 20.0, step:0.1,
        change: function(event, ui) {$("#limit_v").html(ui.value); limit_v = ui.value; updateShareString();},
        slide:  function(event, ui) {$("#limit_v").html(ui.value); limit_v = ui.value; updateShareString();}
    });
    $("#sld_limit_v").slider("value", limit_v);

    $("#btn_aniso_u").button({
        icons : {primary : "ui-icon-closethick"},
        label: "U"
    });
    $("#btn_aniso_v").button({
        icons : {primary : "ui-icon-closethick"},
        label: "V"
    });
    $("#btn_split").button({
        icons : {primary : "ui-icon-closethick"},
        label: "S"
    });
    
    $('#share').keypress(function (e) {
        if (e.which == 13) {
            parseShareString();
            return false;
        }
    });    
}

alertInvalidShareString = function()
{
    $("#share").val("Invalid string!");
    setTimeout(updateShareString, 1000);
}

parseShareString = function()
{
    var str = $("#share").val();
    var fields = str.split(",");
    
    if (fields.length != 15)
    {
        alertInvalidShareString();
        return;
    }
    
    var new_chem = parseFloat(fields[0]);
    var new_diff_u = parseFloat(fields[1]);
    var new_diff_v = parseFloat(fields[2]);
    var new_limit_u = parseFloat(fields[3]);
    var new_limit_v = parseFloat(fields[4]);
    
    if (isNaN(new_chem) || isNaN(new_diff_u) || isNaN(new_diff_v) || 
        isNaN(new_limit_u) || isNaN(new_limit_v)) {
        alertInvalidShareString();
        return;
    }
    
    var new_values = [];
    for (var i=0; i<5; i++) {
        var v = [parseFloat(fields[5+2*i]), fields[5+2*i+1]];
        
        if (isNaN(v[0])) {
            alertInvalidShareString();
            return;
        }
        
        // Check if the string is a valid color.
        if (! /^#[0-9A-F]{6}$/i.test(v[1])) {
            alertInvalidShareString();
            return;
        }
        
        new_values.push(v);
    }
    
    chem = new_chem;
    diff_u = new_diff_u;
    diff_v = new_diff_v;
    limit_u = new_limit_u;
    limit_v = new_limit_v;
    $("#gradient").gradient("setValues", new_values);
    worldToForm();
}

updateShareString = function()
{
    var str = "".concat(chem, ",", diff_u, ",", diff_v, ",", limit_u, ",", limit_v);
    
    var values = $("#gradient").gradient("getValues");
    for (var i=0; i<values.length; i++) {
        var v = values[i];
        str += "".concat(",", v[0], ",", v[1]);
    }
    $("#share").val(str);
}

})();

