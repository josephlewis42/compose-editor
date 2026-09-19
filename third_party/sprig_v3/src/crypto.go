package sprig

import (
	"crypto/rand"
	"crypto/sha1"
	"crypto/sha256"
	"crypto/sha512"
	"encoding/base64"
	"encoding/hex"
	"fmt"
	"hash/adler32"

	"strings"

	"github.com/google/uuid"
	bcrypt_lib "golang.org/x/crypto/bcrypt"
)

func sha512sum(input string) string {
	hash := sha512.Sum512([]byte(input))
	return hex.EncodeToString(hash[:])
}

func sha256sum(input string) string {
	hash := sha256.Sum256([]byte(input))
	return hex.EncodeToString(hash[:])
}

func sha1sum(input string) string {
	hash := sha1.Sum([]byte(input))
	return hex.EncodeToString(hash[:])
}

func adler32sum(input string) string {
	hash := adler32.Checksum([]byte(input))
	return fmt.Sprintf("%d", hash)
}

func bcrypt(input string) string {
	hash, err := bcrypt_lib.GenerateFromPassword([]byte(input), bcrypt_lib.DefaultCost)
	if err != nil {
		return fmt.Sprintf("failed to encrypt string with bcrypt: %s", err)
	}

	return string(hash)
}

func hashSha(password string) string {
	s := sha1.New()
	s.Write([]byte(password))
	passwordSum := []byte(s.Sum(nil))
	return base64.StdEncoding.EncodeToString(passwordSum)
}

// HashAlgorithm enum for hashing algorithms
type HashAlgorithm string

const (
	// HashBCrypt bcrypt - recommended
	HashBCrypt = "bcrypt"
	HashSHA    = "sha"
)

func htpasswd(username string, password string, hashAlgorithm HashAlgorithm) string {
	if strings.Contains(username, ":") {
		return fmt.Sprintf("invalid username: %s", username)
	}
	switch hashAlgorithm {
	case HashSHA:
		return fmt.Sprintf("%s:{SHA}%s", username, hashSha(password))
	default:
		return fmt.Sprintf("%s:%s", username, bcrypt(password))
	}
}

func randBytes(count int) (string, error) {
	buf := make([]byte, count)
	if _, err := rand.Read(buf); err != nil {
		return "", err
	}
	return base64.StdEncoding.EncodeToString(buf), nil
}

// uuidv4 provides a safe and secure UUID v4 implementation
func uuidv4() string {
	return uuid.New().String()
}
