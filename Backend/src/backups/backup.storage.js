import fs from "fs";
import path from "path";
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const isS3Enabled = () => String(process.env.BACKUP_S3_ENABLED || "").toLowerCase() === "true";

const getS3Client = () => {
    const region = process.env.BACKUP_S3_REGION;
    const accessKeyId = process.env.BACKUP_S3_ACCESS_KEY_ID;
    const secretAccessKey = process.env.BACKUP_S3_SECRET_ACCESS_KEY;
    if (!region || !accessKeyId || !secretAccessKey) {
        throw new Error("Missing S3 configuration (region/access key/secret key)");
    }
    return new S3Client({
        region,
        credentials: {
            accessKeyId,
            secretAccessKey,
        },
    });
};

const getS3Bucket = () => process.env.BACKUP_S3_BUCKET;
const getS3Prefix = () => (process.env.BACKUP_S3_PREFIX || "backups/system").replace(/^\//, "");

const buildS3Key = (filename) => {
    const prefix = getS3Prefix();
    return prefix ? `${prefix}/${filename}` : filename;
};

const buildS3Url = (bucket, region, key) =>
    `https://${bucket}.s3.${region}.amazonaws.com/${encodeURI(key)}`;

export const uploadBackupToS3 = async (filePath, filename) => {
    if (!isS3Enabled()) {
        return { uploaded: false };
    }
    const bucket = getS3Bucket();
    if (!bucket) {
        throw new Error("Missing BACKUP_S3_BUCKET");
    }
    const client = getS3Client();
    const key = buildS3Key(filename);
    const region = process.env.BACKUP_S3_REGION;
    const body = fs.createReadStream(filePath);
    const contentType = filename.endsWith(".zip") ? "application/zip" : "application/json";
    const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
    });
    await client.send(command);
    return {
        uploaded: true,
        bucket,
        key,
        url: buildS3Url(bucket, region, key),
        storage: { type: "s3", bucket, key, region },
    };
};

export const getSignedBackupUrl = async (storage, expiresSeconds = 900) => {
    if (storage?.type !== "s3") return null;
    const bucket = storage.bucket || getS3Bucket();
    const key = storage.key;
    if (!bucket || !key) return null;
    const client = getS3Client();
    const command = new GetObjectCommand({ Bucket: bucket, Key: key });
    return getSignedUrl(client, command, { expiresIn: expiresSeconds });
};

export const getBackupReadStream = async (storage, filePath) => {
    if (storage?.type === "s3") {
        const bucket = storage.bucket || getS3Bucket();
        const key = storage.key;
        if (!bucket || !key) {
            throw new Error("Missing S3 bucket/key for restore");
        }
        const client = getS3Client();
        const command = new GetObjectCommand({ Bucket: bucket, Key: key });
        const response = await client.send(command);
        if (!response.Body) {
            throw new Error("S3 object body is empty");
        }
        return response.Body;
    }
    if (!filePath) {
        throw new Error("Missing filePath for local restore");
    }
    return fs.createReadStream(path.resolve(filePath));
};

export const deleteBackupFromS3 = async (storage) => {
    if (!isS3Enabled() || storage?.type !== "s3") {
        return { deleted: false };
    }
    const bucket = storage.bucket || getS3Bucket();
    const key = storage.key;
    if (!bucket || !key) {
        return { deleted: false };
    }
    const client = getS3Client();
    const command = new DeleteObjectCommand({ Bucket: bucket, Key: key });
    await client.send(command);
    return { deleted: true };
};
