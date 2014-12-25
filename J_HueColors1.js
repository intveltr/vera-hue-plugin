var HUE_COLOR_SID = "urn:intvelt-com:serviceId:HueColors1";
var hueField = { width: 600, height: 250, top: 40, margin: 2 };
var hueDevice;

/////////////
// Color tab

function hueColorTab(deviceID) {
   hueDevice = deviceID;
   var html = '<style type="text/css">canvas { cursor: crosshair }</style>';
   html += '<canvas id="hueCanvas" width="' + hueField.width + '" height="' + hueField.height + '" style="border:0px;" '
   html += 'onmousemove="hueMouseMove(event)" onmouseout="hueMouseOut()" onclick="hueMouseClick(event)">'
   html += 'Your browser does not support the HTML5 canvas tag.</canvas>';
   html += '<div id="hueCursor" style="position: absolute; top: ' + (hueField.height + 25) + '; left: 50"></div>';
   set_panel_html(html);
   hueCreateColorField("hueCanvas");
}

function hueCreateColorField(id) {
   var c = document.getElementById(id);
   var dc = c.getContext("2d");

   var grad = dc.createLinearGradient(0, 0, hueField.width, 0);
   grad.addColorStop(0, 'hsl(50, 100%, 80%)');
   grad.addColorStop(0.45, 'white');
   grad.addColorStop(0.55, 'white');
   grad.addColorStop(1, 'hsl(190, 100%, 70%)');
   dc.fillStyle = grad;
   dc.fillRect(0, 0, hueField.width, hueField.top);

   for (var i = 0; i < hueField.width; ++i) {
      var ratio = i / hueField.width;
      var hue = Math.floor(360 * ratio);
      var sat = 100;
      var lum = 50;
      var grad = dc.createLinearGradient(0, hueField.top + hueField.margin, 0, hueField.height - hueField.margin);
      grad.addColorStop(0, 'white');
      grad.addColorStop(1, 'hsl(' + hue + ',' + sat + '%,' + lum + '%)');
      dc.fillStyle = grad;
      dc.fillRect(i, hueField.top, i + 1, hueField.height);
  }
}

function hueGetHueSatTemp(event) {
   function getOffset(el) {
      var _x = 0;
      var _y = 0;
      while (el && !isNaN(el.offsetLeft) && !isNaN(el.offsetTop)) {
         _x += el.offsetLeft;
         _y += el.offsetTop;
         el = el.offsetParent;
      }
      return { top: _y, left: _x };
   }
   var elem = document.getElementById("hueCanvas");
   var x = 0;
   var y = 0;
   if (elem !== undefined) {
      x = event.clientX - getOffset(elem).left - 1;
      y = event.clientY - getOffset(elem).top - 2;
      if (x < 0) { x = 0 };
      if (y < 0) { y = 0 };
   }
   var tmp = -1;
   var hue = -1;
   var sat = -1;
   if (y <= hueField.top) {
      // Top bar - select Kelvin color (ignore y value)
      tmp = 100 - 100 * (x / (hueField.width - 1));
   } else {
      // Color field
      y = y - hueField.top;
      hue = 100 * (x / (hueField.width - 1));
      sat = 100 * (y / (hueField.height - hueField.top - 1));
   }
   return { 'hue': hue, 'sat': sat, 'temp': tmp };
}

function hueMouseMove(event) {
   var val = hueGetHueSatTemp(event);
   var elem = document.getElementById("hueCursor");
   if (val.temp < 0) {
      elem.innerHTML = "Hue: " + val.hue.toFixed(1) + "%, Saturation: " + val.sat.toFixed(1) + "%";
   } else {
      var kelvin = 6500 - 4500 * val.temp / 100;
      elem.innerHTML = "Temperature: " + kelvin.toFixed(0) + "K (" + val.temp.toFixed(1) + "%)";
   }
}

function hueMouseOut() {
   document.getElementById("hueCursor").innerHTML = '';
}

function hueMouseClick(event) {
   var val = hueGetHueSatTemp(event);
   if (val.temp >= 0) {
      hueCallAction(hueDevice, HUE_COLOR_SID, "SetColorTemperature", {'newColorTemperature': val.temp});
   } else {
      hueCallAction(hueDevice, HUE_COLOR_SID, "SetHueSaturation", {'newHue': val.hue, 'newSaturation': val.sat});
   }
}

function hueCallAction(device, sid, actname, args) {
   var result = '';
   var q = {
      'id': 'lu_action',
      'output_format': 'xml',
      'DeviceNum': device,
      'serviceId': sid,
      'action': actname
   };
   var key, count = 0;
   for (key in args) {
      count++;
   }
   if (count > 0) {
      jQuery.extend(q, args);
   }
   jQuery.extend(q, {timestamp: new Date().getTime()}); //we need this to avoid IE caching of the AJAX get
   new Ajax.Request (command_url+'/data_request', {
      method: 'get',
      parameters: q,
      onSuccess: function (response) {
      },
      onFailure: function (response) {
      },
      onComplete: function (response) {
         result = response.responseText;
      }
   });
   return result;
}