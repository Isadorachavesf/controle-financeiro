package br.com.gelatoegrano.uranodiag;

import android.Manifest;
import android.app.Activity;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothSocket;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings;
import android.widget.*;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.concurrent.atomic.AtomicBoolean;

public class MainActivity extends Activity {
    private static final UUID SPP = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB");
    private static final int REQ_BT = 44;
    private BluetoothAdapter adapter;
    private final List<BluetoothDevice> devices = new ArrayList<>();
    private Spinner spinner;
    private TextView status, weight, log;
    private BluetoothSocket socket;
    private Thread readerThread;
    private final AtomicBoolean reading = new AtomicBoolean(false);

    @Override public void onCreate(Bundle b) {
        super.onCreate(b); setContentView(R.layout.activity_main);
        spinner=findViewById(R.id.deviceSpinner); status=findViewById(R.id.statusText); weight=findViewById(R.id.weightText); log=findViewById(R.id.logText);
        findViewById(R.id.refreshBtn).setOnClickListener(v->loadPaired());
        findViewById(R.id.settingsBtn).setOnClickListener(v->startActivity(new Intent(Settings.ACTION_BLUETOOTH_SETTINGS)));
        findViewById(R.id.connectBtn).setOnClickListener(v->connectSelected());
        findViewById(R.id.disconnectBtn).setOnClickListener(v->disconnect());
        findViewById(R.id.clearBtn).setOnClickListener(v->log.setText(""));
        adapter=BluetoothAdapter.getDefaultAdapter();
        ensurePermissionAndLoad();
    }

    private void ensurePermissionAndLoad(){
        if(adapter==null){ setStatus("Bluetooth não disponível neste aparelho"); return; }
        if(Build.VERSION.SDK_INT>=31 && checkSelfPermission(Manifest.permission.BLUETOOTH_CONNECT)!=PackageManager.PERMISSION_GRANTED){
            requestPermissions(new String[]{Manifest.permission.BLUETOOTH_CONNECT},REQ_BT); return;
        }
        loadPaired();
    }
    @Override public void onRequestPermissionsResult(int req,String[] p,int[] g){super.onRequestPermissionsResult(req,p,g);if(req==REQ_BT)loadPaired();}

    @SuppressWarnings("MissingPermission") private void loadPaired(){
        if(Build.VERSION.SDK_INT>=31 && checkSelfPermission(Manifest.permission.BLUETOOTH_CONNECT)!=PackageManager.PERMISSION_GRANTED){ensurePermissionAndLoad();return;}
        devices.clear(); List<String> labels=new ArrayList<>();
        Set<BluetoothDevice> bonded=adapter.getBondedDevices();
        if(bonded!=null) for(BluetoothDevice d:bonded){ devices.add(d); labels.add((d.getName()!=null?d.getName():"Sem nome")+" · "+d.getAddress()); }
        labels.sort(String.CASE_INSENSITIVE_ORDER);
        List<BluetoothDevice> sorted=new ArrayList<>();
        for(String label:labels) for(BluetoothDevice d:devices) if(label.endsWith(d.getAddress())){sorted.add(d);break;}
        devices.clear(); devices.addAll(sorted);
        spinner.setAdapter(new ArrayAdapter<>(this,android.R.layout.simple_spinner_dropdown_item,labels));
        setStatus(labels.isEmpty()?"Nenhum dispositivo pareado. Abra Bluetooth e faça o pareamento primeiro.":"Selecione a balança pareada e toque em Conectar.");
    }

    @SuppressWarnings("MissingPermission") private void connectSelected(){
        if(devices.isEmpty()||spinner.getSelectedItemPosition()<0){setStatus("Nenhum dispositivo pareado selecionado.");return;}
        BluetoothDevice d=devices.get(spinner.getSelectedItemPosition()); disconnect();
        setStatus("Conectando a "+safeName(d)+"…");
        new Thread(()->{
            BluetoothSocket s=null;
            try{
                adapter.cancelDiscovery();
                try { s=d.createRfcommSocketToServiceRecord(SPP); s.connect(); }
                catch(Exception secureFail){ closeQuiet(s); s=d.createInsecureRfcommSocketToServiceRecord(SPP); s.connect(); }
                socket=s; final BluetoothSocket connected=s;
                runOnUiThread(()->setStatus("Conectada a "+safeName(d)+" · aguardando frames"));
                startReader(connected.getInputStream());
            }catch(Exception e){closeQuiet(s);runOnUiThread(()->setStatus("Falha ao conectar: "+e.getClass().getSimpleName()+" · "+String.valueOf(e.getMessage())));}
        }).start();
    }

    private void startReader(InputStream in){
        reading.set(true); readerThread=new Thread(()->{
            byte[] buf=new byte[256]; ByteQueue queue=new ByteQueue();
            try{
                while(reading.get()){
                    int n=in.read(buf); if(n<0)break; if(n==0)continue;
                    byte[] chunk=Arrays.copyOf(buf,n); queue.add(chunk);
                    Integer grams=parseUrano(queue.bytes());
                    String line="HEX "+hex(chunk)+" | TXT "+printable(chunk);
                    runOnUiThread(()->{appendLog(line);if(grams!=null){weight.setText(grams+" g");setStatus("Peso recebido e interpretado");}});
                    if(queue.size()>512) queue.keepLast(128);
                }
            }catch(Exception e){ if(reading.get()) runOnUiThread(()->setStatus("Leitura interrompida: "+String.valueOf(e.getMessage()))); }
            finally{reading.set(false);}
        }); readerThread.start();
    }

    private Integer parseUrano(byte[] a){
        for(int i=0;i+8<a.length;i++) if((a[i]&0xFF)==0x02 && (a[i+8]&0xFF)==0x03){
            String t=new String(a,i+1,7,StandardCharsets.US_ASCII).trim().replace(',','.');
            if(t.matches("[+-]?\\d{1,2}\\.\\d{3}")){try{double kg=Double.parseDouble(t);if(kg>=0)return (int)Math.round(kg*1000.0);}catch(Exception ignored){}}
        }
        for(int i=0;i+6<a.length;i++) if((a[i]&0xFF)==0x02 && (a[i+6]&0xFF)==0x03){
            String t=new String(a,i+1,5,StandardCharsets.US_ASCII).trim();
            if(t.matches("\\d{1,5}")){try{return Integer.parseInt(t);}catch(Exception ignored){}}
        }
        return null;
    }

    private void disconnect(){reading.set(false);closeQuiet(socket);socket=null;runOnUiThread(()->setStatus("Desconectada"));}
    @Override protected void onDestroy(){disconnect();super.onDestroy();}
    private void closeQuiet(BluetoothSocket s){try{if(s!=null)s.close();}catch(Exception ignored){}}
    @SuppressWarnings("MissingPermission") private String safeName(BluetoothDevice d){try{return d.getName()!=null?d.getName():d.getAddress();}catch(Exception e){return d.getAddress();}}
    private void setStatus(String s){status.setText("Status: "+s);}
    private void appendLog(String s){String old=log.getText().toString();String next=(old.isEmpty()?"":old+"\n")+s;if(next.length()>18000)next=next.substring(next.length()-14000);log.setText(next);}
    private static String hex(byte[] b){StringBuilder s=new StringBuilder();for(byte x:b)s.append(String.format(Locale.US,"%02X ",x&0xFF));return s.toString().trim();}
    private static String printable(byte[] b){StringBuilder s=new StringBuilder();for(byte x:b){int c=x&0xFF;s.append(c>=32&&c<=126?(char)c:'.');}return s.toString();}
    private static class ByteQueue{byte[] a=new byte[0];void add(byte[] b){byte[] n=new byte[a.length+b.length];System.arraycopy(a,0,n,0,a.length);System.arraycopy(b,0,n,a.length,b.length);a=n;}byte[] bytes(){return a;}int size(){return a.length;}void keepLast(int n){if(a.length<=n)return;a=Arrays.copyOfRange(a,a.length-n,a.length);}}
}
