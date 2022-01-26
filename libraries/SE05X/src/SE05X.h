/*
  SE05X.h
  Copyright (c) 2022 Arduino SA.  All right reserved.

  This library is free software; you can redistribute it and/or
  modify it under the terms of the GNU Lesser General Public
  License as published by the Free Software Foundation; either
  version 2.1 of the License, or (at your option) any later version.

  This library is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
  Lesser General Public License for more details.

  You should have received a copy of the GNU Lesser General Public
  License along with this library; if not, write to the Free Software
  Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
*/

#ifndef _SE05X_H_
#define _SE05X_H_

#include <Arduino.h>
#include "ex_sss_boot.h"
#include "fsl_sss_api.h"
#include "se05x_apis.h"

#if defined SE05X_PRINT_ERROR
#define LOG_E Serial.println
#else
#define LOG_E
#endif

class SE05XClass
{
public:
    SE05XClass();
    virtual ~SE05XClass();

    int begin();
    void end();

    String serialNumber();

    long random(long max);
    long random(long min, long max);
    int random(byte data[], size_t length);

    int generatePrivateKey(int keyId, byte pubKeyDer[], size_t pubKeyDerMaxLen, size_t * pubKeyDerLen);
    int generatePublicKey(int keyId, byte pubKeyDer[], size_t pubKeyDerMaxLen, size_t * pubKeyDerLen);
    int importPublicKey(int keyId, const byte pubKeyDer[], size_t pubKeyDerLen);

    int beginSHA256();
    int updateSHA256(const byte in[], size_t inLen);
    int endSHA256(byte out[], size_t * outLen);
    int SHA256(const byte in[], size_t inLen, byte out[], size_t outMaxLen, size_t * outLen);

    int Sign(int keyId, const byte hash[], size_t hashLen, byte sig[], size_t maxSigLen, size_t * sigLen);
    int Verify(int keyId, const byte hash[], size_t hashLen, byte sig[],size_t sigLen);

    int readBinaryObject(int ObjectId, byte data[], size_t dataMaxLen, size_t * length);
    int writeBinaryObject(int ObjectId, const byte data[], size_t length);

private:
    int initObject(size_t objectId, sss_object_t * object, sss_key_part_t objectPart, sss_key_object_mode_t objectMode, sss_cipher_type_t objectChiper);

private:
    ex_sss_boot_ctx_t _boot_ctx;
    sss_digest_t _digest_ctx;
};

extern SE05XClass SE05X;

#endif
