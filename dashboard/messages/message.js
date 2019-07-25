

  angular.module('sharekey.message', ['ui.router'])
  
  .config(['$stateProvider', function($stateProvider) {
    $stateProvider.state('dash.messages', {
      url: '/newMessages',
      templateUrl: 'dashboard/messages/message.html',
      controller: 'messagesController',
      css: 'messages.css'
    });
    $stateProvider.state('dash.read', {
      url: '/messages?id',
      templateUrl: 'dashboard/messages/readMessage.html',
      controller: 'messagesController',
      css: 'messages.css'
    })
    $stateProvider.state('dash.inbox', {
      url: '/messageInbox',
      templateUrl: 'dashboard/messages/inbox.html',
      controller: 'messagesController',
      css: 'messages.css'
    })
    $stateProvider.state('dash.outbox', {
      url: '/messageOutbox',
      templateUrl: 'dashboard/messages/outbox.html',
      controller: 'messagesController',
      css: 'messages.css'
    })
  }])

.controller('messagesController', function($scope,$http,$localStorage,$state,$window,$location,$sessionStorage,$stateParams){
      uid = $localStorage.uid
      $scope.userKeys = $localStorage[uid + 'keys'];
      var token = $localStorage.userToken;

  $scope.getPublicKey =  function (idUser){
    if (!$scope.message){
      alert("No puede mandar un mensaje en blanco")
    }else{
      var popup = angular.element("#messageSpinner");
      //for hide model
      popup.modal('show');
      var keyRequest = $.param({
          id: idUser
      })

      $http({
        url: __env.apiUrl + __env.profile + uid + '/getPublicKey',
        method: 'POST',
        data: keyRequest,
        headers: {'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8','Authorization':'Bearer: ' + token}
      }).then(function (response){
        console.log('retrieved public key from server')
        $scope.encrypt(response.data.data,message);
      }).catch(function (error){
        if (error){
          if (error.status == 401){
              alert('Su sesion ha vencido')
              $state.go('dash.login');
          }
          else{
              console.log(error.code);
              console.log(error.message);
          }
      } 
      })  
    }
  }

  var getPublicKey = function (name){
    for (var i = 0 ; i < $scope.userKeys.length; i++){
        if ($scope.userKeys[i].keyname ==name){
            return $scope.userKeys[i].publicKey
        }
    }
  }

  var getPrivateKey = function (name){
    for (var i = 0 ; i < $scope.userKeys.length; i++){
        if ($scope.userKeys[i].keyname == name){
            return $scope.userKeys[i].privateKey
        }
    }
  }

  var decryptKey = function (key,password) {
    var bytes  = CryptoJS.AES.decrypt(key,password);
    var key = bytes.toString(CryptoJS.enc.Utf8);
    return key;

  }

  var encryptWithMultiplePublicKeys  = async (pubkeys, privkey, passphrase, message) => {
    pubkeys = pubkeys.map(async (key) => {
      return (await openpgp.key.readArmored(key)).keys[0]
    });
    if (passphrase == null){
      const options = {
        message: openpgp.message.fromText(message),
        publicKeys: await Promise.all(pubkeys)       				  // for encryption
      }
      return openpgp.encrypt(options).then(ciphertext => {
        encrypted = ciphertext.data // '-----BEGIN PGP MESSAGE ... END PGP MESSAGE-----'
        return encrypted
    })
    }else{
      const privKeyObj = (await openpgp.key.readArmored(privkey)).keys[0]
      await privKeyObj.decrypt(passphrase)

      const options = {
          message: openpgp.message.fromText(message),
          publicKeys: await Promise.all(pubkeys),           				  // for encryption
          privateKeys: [privKeyObj]                                 // for signing (optional)
      }
      return openpgp.encrypt(options).then(ciphertext => {
        encrypted = ciphertext.data // '-----BEGIN PGP MESSAGE ... END PGP MESSAGE-----'
        return encrypted
    })
    }  
   };

   $scope.getContacts = function (){

    $http({
        url: __env.apiUrl + __env.profile + uid + '/contacts',
        method: 'GET',
        headers: {'Authorization':'Bearer: ' + token}
    }).then(function (response){
        if (response.data.status == 200){
            console.log('contacts received')
            $scope.contacts = response.data.data
        }
    }).catch(function (error){
        if (error.status == 401){
          alert('Su sesion ha vencido')
          $state.go('dash.login');
        }
    })

  } 

  $scope.encrypt = function (key) {

      console.log('begin encription')
      keyPublic = getPublicKey($scope.chatKey);
      keyPrivate = getPrivateKey($scope.chatKey);
      pKeys = [keyPublic,key]
      Private = decryptKey(keyPrivate,$sessionStorage.appKey);
      message = encryptWithMultiplePublicKeys(pKeys,Private,$scope.passphrase,$scope.message);
      message.then( function (encryptedMessage){
        sendMessage(encryptedMessage);
      }).catch(function (error){
        alert(error)
      })
    }

  var sendMessage = function (messageEncrypted){
    if (!$scope.publish){
      $scope.publish = false;
    }
    messageRequest = $.param({
      id_sender: uid,
      username: $localStorage[uid + '-username'],
      content: messageEncrypted,
      recipient: $scope.id_recipient,
      publish: $scope.publish
    })
    $http({
      url: __env.apiUrl + __env.messages + uid,
      method: "POST",
      data: messageRequest,
      headers:  {'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8','Authorization':'Bearer: ' + token}
    }).then(function (response){
      var popup = angular.element("#messageSpinner");
      //for hide model
      popup.modal('hide');
      alert('Su mensaje se ha enviado');
      console.log('message sent');
    }).catch(function (error){
      if (error){
        if (error.status == 401){
            alert('Su sesion ha vencido')
            $state.go('dash.login');
        }
        else{
            console.log(error.code);
            console.log(error.message);
        }
    } 
    })
  }

  $scope.getMessage = function (){
    $http({
      url: __env.apiUrl + __env.messages + uid + '/' + $stateParams.id,
      method: "GET",
      headers:  {'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8','Authorization':'Bearer: ' + token}
    }).then(function (response){
      $scope.data = response.data.data
      console.log(response.data.data)
      $scope.mensaje = response.data.data.content
    }).catch(function (error){
      if (error){
        if (error.status == 401){
            alert('Su sesion ha vencido')
            $state.go('dash.login');
        }
        else{
            console.log(error.code);
            console.log(error.message);
        }
    } 
    })
  }

  var getPrivateKey = function (){
    for (var i = 0 ; i < $scope.userKeys.length; i++){
        if ($scope.userKeys[i].default == true){
            return $scope.userKeys[i].privateKey
        }
    }
  }

  var decriptMessage = async (privateKey,passphrase,mensaje) => {
      const privKeyObj = (await openpgp.key.readArmored(privateKey)).keys[0]
      await privKeyObj.decrypt(passphrase)

      const options = {
          message: await openpgp.message.readArmored(mensaje),    // parse armored message
          //publicKeys: (await openpgp.key.readArmored(pubkey)).keys, // for verification (optional)
          privateKeys: [privKeyObj]                                 // for decryption
      }

      return openpgp.decrypt(options).then(plaintext => {
          decrypted = plaintext.data;
          return decrypted
      })
  }

  $scope.decrypt = async () => {
    privateKey = getPrivateKey();
    privateKey = decryptKey(privateKey,$sessionStorage.appKey);
    message = decriptMessage(privateKey, $scope.passphrase, $scope.mensaje)
    message.then(function (decrypted){
      var popup = angular.element("#readingSpinner");
        //for hide model
      popup.modal('hide');
      $scope.decrypted = decrypted;
      $scope.$apply();
    }).catch(function (error){
        alert(error)
    })
  } 

  $scope.respond = function(name,id) {
    console.log(name,id)
    $state.go('dash.messages',{'id_user': id,'name': name});
  }

  var getDate = function (messages){
    for (i = 0; i < messages.length; i++){
      sent = new Date(messages[i].data.timestamp);
      messages[i].sent = sent.toLocaleString();
    }
    return messages
  }

    $scope.getMessages = function (tray){
      var requestMessages = $.param({
        user_id: uid
      })
      $http({
          url: __env.apiUrl + __env.messages + uid + '/mail/' +tray,
          method: 'POST',
          data: requestMessages,
          headers: {'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8','Authorization':'Bearer: ' + token}
      }).then(function (response){
          console.log(response);
          if (response.data.status == 200){
              messages = response.data.data;
              $scope.correos = getDate(messages);
          }
      }).catch(function (error){
          console.log(error);
      })
  }

  $scope.deleteMessage = function (id){
      console.log(id);
      $http({
          url: __env.apiUrl + __env.messages + uid + '/' + id,
          method: 'DELETE',
          headers: {'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8','Authorization':'Bearer: ' + token}
      }).then(function (response){
          if (response.data.status == 200){
              console.log(response.data);
              alert('se ha eliminado un mensaje')
              $state.reload();
          }
      }).catch(function (error){
          alert(error)
      })
  }

  var updateStatus = function(id){
    $http({
        url: __env.apiUrl + __env.messages + uid + '/' + id,
        method: 'PUT',
        headers: {'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8','Authorization':'Bearer: ' + token}
    }).then(function (response){
        console.log(response.data)
    }).catch(function (error){
        alert(error)
    })
}

  $scope.readMessage =  function (id, status){
    if (status == 'unread'){
        updateStatus(id);
    }
    $state.go('dash.read',{'id': id})
  }

  $scope.publishMessage = function (){
    var publishRequest = $.param({
      sender: $scope.data.sender,
      id_sender: $scope.data.id_sender,
      content: $scope.decrypted
    })
    $http({
      url: __env.apiUrl + __env.messages + uid + '/' + $stateParams.id + '/publish',
      method: 'POST',
      data: publishRequest,
      headers: {'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8','Authorization':'Bearer: ' + token}
    }).then(function (response){
        console.log(response);
        alert('Su feedback ha sido publicado exitosamente')
    }).catch(function (error){
        console.log(error);
    })
  }
})